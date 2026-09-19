from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .models import Transaction, Budget, Category, VisionEntity, GamificationStats, DevicePushToken, BinanceConnection
from .serializers import TransactionSerializer, BudgetSerializer, CategorySerializer, VisionEntitySerializer, GamificationStatsSerializer, DevicePushTokenSerializer
from .ml import predict_category_for_user
from .nlp import parse_voice_command
from .analytics import predict_runway
from .recurrence import process_recurring_transactions
from .ai_chat import AnthropicServiceError, ImagePayloadError, get_chat_reply
from .binance_client import (
    BinanceCredentialsError,
    BinanceServiceError,
    check_read_only_permissions,
    fetch_spot_balances,
)
from .secrets_crypto import encrypt_secret, decrypt_secret, SecretEncryptionError
from django.utils import timezone
from django.conf import settings
import os
import json
import urllib.request
import urllib.error

class CronViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny] # Secured by header check manually
    authentication_classes = []  # Avoid JWT auth treating CRON_SECRET as an access token

    @action(detail=False, methods=['get'])
    def process_recurring(self, request):
        # Verify Vercel Cron Secret (or general shared secret)
        auth_header = request.headers.get('Authorization', '')
        # Prioritize env var directly, fallback to settings (no insecure default)
        cron_secret = os.environ.get('CRON_SECRET') or getattr(settings, 'CRON_SECRET', None)
        if not cron_secret:
            return Response(
                {"error": "CRON_SECRET_NOT_CONFIGURED"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        incoming_token = auth_header.replace('Bearer ', '').strip()
        if incoming_token != cron_secret:
            return Response(
                {
                    "error": "Unauthorized",
                    "debug": {
                        "hasAuthorizationHeader": bool(auth_header),
                        "authHeaderStartsWithBearer": auth_header.startswith("Bearer "),
                        "incomingTokenLength": len(incoming_token),
                        "configuredSecretLength": len(cron_secret),
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        result = process_recurring_transactions()
        return Response({"status": "success", **result})

class DevicePushTokenViewSet(viewsets.ModelViewSet):
    serializer_class = DevicePushTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DevicePushToken.objects.filter(user=self.request.user).order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        expo_push_token = request.data.get('expo_push_token') or request.data.get('expoPushToken')
        platform = request.data.get('platform')
        if not expo_push_token:
            return Response({"error": "expo_push_token_required"}, status=status.HTTP_400_BAD_REQUEST)

        token_obj, created = DevicePushToken.objects.update_or_create(
            expo_push_token=expo_push_token,
            defaults={
                "user": request.user,
                "platform": platform,
            },
        )

        serializer = self.get_serializer(token_obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class PushViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @action(detail=False, methods=['post'], url_path='suggest')
    def suggest(self, request):
        auth_header = request.headers.get('Authorization', '')
        shortcut_secret = os.environ.get('SHORTCUT_SECRET') or getattr(settings, 'SHORTCUT_SECRET', None)
        if not shortcut_secret:
            return Response({"error": "SHORTCUT_SECRET_NOT_CONFIGURED"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        incoming_token = auth_header.replace('Bearer ', '').strip()
        if incoming_token != shortcut_secret:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = request.data.get('user_id') or request.data.get('userId')
        title = request.data.get('title') or "Nueva transacción"
        body = request.data.get('body') or "¿Quieres agregar esta transacción?"
        data = request.data.get('data') or {}

        if not user_id:
            return Response({"error": "user_id_required"}, status=status.HTTP_400_BAD_REQUEST)

        tokens = list(DevicePushToken.objects.filter(user_id=user_id).values_list('expo_push_token', flat=True))
        if not tokens:
            return Response({"error": "no_push_tokens_for_user"}, status=status.HTTP_404_NOT_FOUND)

        messages = []
        for t in tokens:
            messages.append(
                {
                    "to": t,
                    "sound": "default",
                    "title": title,
                    "body": body,
                    "categoryId": "wallet_tx_suggestion",
                    "data": {"kind": "wallet_tx_suggestion", **data},
                }
            )

        req = urllib.request.Request(
            "https://exp.host/--/api/v2/push/send",
            data=json.dumps(messages).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read().decode("utf-8")
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = {"raw": raw}
                return Response({"status": "ok", "expo": parsed})
        except urllib.error.HTTPError as e:
            return Response(
                {"error": "expo_http_error", "status_code": e.code, "body": e.read().decode("utf-8")},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as e:
            return Response({"error": "expo_send_failed", "detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def forecast(self, request):
        """
        Returns a cash flow forecast (runway prediction) based on historical spending.
        """
        result = predict_runway(request.user)
        return Response(result)

class ChatViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='message')
    def message(self, request):
        """
        One turn of the AI chat. v1 is session-only — the client resends the
        recent conversation each call, nothing is persisted server-side.
        Body: {
            "message": "...",
            "history": [{"role": "user"|"assistant", "content": "..."}],
            "images": [{"media_type": "image/jpeg", "data": "<base64>"}]
        }
        `message` may be empty when images are attached (a receipt photo sent
        on its own is a complete request).
        """
        text = (request.data.get('message') or '').strip()
        history = request.data.get('history') or []
        images = request.data.get('images') or []

        if not text and not images:
            return Response({"error": "message_required"}, status=status.HTTP_400_BAD_REQUEST)
        if len(text) > 1000:
            return Response({"error": "message_too_long"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(history, list):
            history = []

        try:
            reply, transaction_proposals = get_chat_reply(request.user, text, history, images)
        except ImagePayloadError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except AnthropicServiceError:
            return Response({"error": "ai_service_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        payload = {"reply": reply}
        if transaction_proposals:
            payload["transaction_proposals"] = transaction_proposals
        return Response(payload)

class BinanceViewSet(viewsets.ViewSet):
    """
    Connects a user's read-only Binance API key so the app can show their
    portfolio. The credentials are validated (read-only permissions only)
    and encrypted before ever touching the database — see
    `secrets_crypto.py`/`binance_client.py` for the security-critical parts.
    Nothing here ever returns the raw key/secret back to the client.
    """
    permission_classes = [permissions.IsAuthenticated]
    # `@action(throttle_scope=...)` isn't a valid ViewSet.as_view() kwarg in
    # this DRF version — instead, get_throttles() below sets this per-action
    # right before ScopedRateThrottle reads it.
    throttle_scope = None

    def get_throttles(self):
        # `connect` handles both POST (calls Binance — throttled) and DELETE
        # (local-only disconnect). Disconnecting must never be rate-limited:
        # if a user suspects a key leaked, revoking it has to always work.
        if self.action == 'connect' and self.request.method == 'POST':
            self.throttle_scope = 'binance-connect'
        elif self.action == 'sync':
            self.throttle_scope = 'binance-sync'
        else:
            self.throttle_scope = None
        return super().get_throttles()

    def _serialize_status(self, connection):
        return {
            "connected": connection is not None,
            "masked_api_key": connection.masked_key_preview if connection else None,
            "last_synced_at": connection.last_synced_at.isoformat() if connection and connection.last_synced_at else None,
        }

    @action(detail=False, methods=['get'], url_path='status')
    def status(self, request):
        connection = BinanceConnection.objects.filter(user=request.user).first()
        return Response(self._serialize_status(connection))

    @action(detail=False, methods=['post', 'delete'], url_path='connect')
    def connect(self, request):
        if request.method == 'DELETE':
            BinanceConnection.objects.filter(user=request.user).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        api_key = (request.data.get('api_key') or '').strip()
        api_secret = (request.data.get('api_secret') or '').strip()
        if not api_key or not api_secret:
            return Response({"error": "api_key_and_secret_required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Never store a key with anything beyond read access — see
            # binance_client.check_read_only_permissions's allowlist logic.
            check_read_only_permissions(api_key, api_secret)
        except BinanceCredentialsError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except BinanceServiceError as exc:
            # Never logs api_key/api_secret — only Binance's own error text,
            # which never echoes the request's credentials back.
            print(f"[BinanceViewSet.connect] {exc}")
            return Response({"error": "binance_service_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            encrypted_key = encrypt_secret(api_key)
            encrypted_secret = encrypt_secret(api_secret)
        except SecretEncryptionError as exc:
            # BINANCE_ENCRYPTION_KEY missing/invalid — a deploy config
            # problem, not the user's key. 500, not 502: it's our server.
            print(f"[BinanceViewSet.connect] {exc}")
            return Response({"error": "encryption_not_configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        masked = f"{api_key[:4]}…{api_key[-4:]}" if len(api_key) > 8 else "••••"
        connection, _ = BinanceConnection.objects.update_or_create(
            user=request.user,
            defaults={
                "api_key_encrypted": encrypted_key,
                "api_secret_encrypted": encrypted_secret,
                "masked_key_preview": masked,
                "is_read_only_confirmed": True,
                "permissions_checked_at": timezone.now(),
            },
        )
        return Response(self._serialize_status(connection))

    @action(detail=False, methods=['post'], url_path='sync')
    def sync(self, request):
        connection = BinanceConnection.objects.filter(user=request.user).first()
        if not connection:
            return Response({"error": "not_connected"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            api_key = decrypt_secret(connection.api_key_encrypted)
            api_secret = decrypt_secret(connection.api_secret_encrypted)
        except SecretEncryptionError:
            # Can't be decrypted with the current key (e.g. a key rotation
            # that didn't re-encrypt this row) — the connection is unusable,
            # drop it instead of leaving a dead row the user can't fix.
            connection.delete()
            return Response({"error": "stored_credentials_unreadable"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Revalidated on EVERY sync, not just at connect time: if the
            # user later grants this same key trading/withdrawal permissions
            # in Binance, this disconnects it instead of trusting a stale
            # check. Any credentials-shaped error here (including a
            # transient signed-request rejection from Binance) disconnects —
            # deliberately conservative given what's at stake; the user can
            # just reconnect if it was a fluke.
            check_read_only_permissions(api_key, api_secret)
            balances = fetch_spot_balances(api_key, api_secret)
        except BinanceCredentialsError as exc:
            print(f"[BinanceViewSet.sync] {exc}")
            connection.delete()
            return Response({"error": str(exc), "disconnected": True}, status=status.HTTP_400_BAD_REQUEST)
        except BinanceServiceError as exc:
            print(f"[BinanceViewSet.sync] {exc}")
            return Response({"error": "binance_service_unavailable"}, status=status.HTTP_502_BAD_GATEWAY)

        connection.last_synced_at = timezone.now()
        connection.permissions_checked_at = timezone.now()
        connection.save(update_fields=['last_synced_at', 'permissions_checked_at'])

        return Response({"balances": balances, "synced_at": connection.last_synced_at.isoformat()})

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')
    
    @action(detail=False, methods=['post'], url_path='predict')
    def predict(self, request):
        """
        Endpoint to predict category based on description.
        Body: { "description": "Starbucks" }
        """
        description = request.data.get('description', '')
        if not description:
            return Response({"error": "Description is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        predicted_category = predict_category_for_user(request.user, description)
        
        return Response({
            "description": description,
            "predicted_category": predicted_category
        })
    
    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        # We need to manually inject the user into the data for validation if using many=True
        # Or we can just iterate and save.
        
        # A simpler way for batch creation where we need to assign user:
        data = request.data
        if not isinstance(data, list):
            return Response({"detail": "Expected a list of items"}, status=status.HTTP_400_BAD_REQUEST)
        
        created_categories = []
        for item in data:
            serializer = self.get_serializer(data=item)
            if serializer.is_valid():
                serializer.save(user=request.user)
                created_categories.append(serializer.data)
            # We skip invalid ones or could raise error
            
        return Response(created_categories, status=status.HTTP_201_CREATED)

class VisionEntityViewSet(viewsets.ModelViewSet):
    serializer_class = VisionEntitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VisionEntity.objects.filter(user=self.request.user).order_by('-amount')

    @action(detail=False, methods=['get'], url_path='debt-plan')
    def debt_plan(self, request):
        """
        Calculates debt payoff plan for user's liabilities.
        Query Params: extra_payment (default 0)
        """
        try:
            extra_payment = Decimal(request.query_params.get('extra_payment', 0))
        except:
            extra_payment = Decimal(0)
            
        # Fetch liabilities
        liabilities = VisionEntity.objects.filter(
            user=request.user, 
            type='liability'
        ).values('id', 'name', 'amount', 'interest_rate', 'minimum_payment')
        
        # Calculate
        from .debt_planner import calculate_payoff_plans
        plans = calculate_payoff_plans(list(liabilities), extra_payment)
        
        return Response(plans)

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        """
        Exports filtered Vision entities to Excel.
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_vision_to_excel
        return export_vision_to_excel(queryset)

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        """
        Exports filtered Vision entities to PDF.
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_vision_to_pdf
        return export_vision_to_pdf(queryset)

class GamificationStatsViewSet(viewsets.ModelViewSet):
    serializer_class = GamificationStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GamificationStats.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post', 'put', 'patch'], url_path='current')
    def current(self, request):
        stats, created = GamificationStats.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(stats)
            return Response(serializer.data)
        
        elif request.method in ['POST', 'PUT', 'PATCH']:
            serializer = self.get_serializer(stats, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        """
        Exports filtered transactions to Excel.
        Supports standard list filters (date, category, etc.)
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_transactions_to_excel
        return export_transactions_to_excel(queryset)

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        """
        Exports filtered transactions to PDF.
        Supports standard list filters.
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_transactions_to_pdf
        return export_transactions_to_pdf(queryset)

    @action(detail=False, methods=['post'], url_path='parse-command')
    def parse_command(self, request):
        """
        Parses a natural language voice command into structured transaction data.
        Body: { "text": "Gasté 500 en Oxxo" }
        """
        text = request.data.get('text', '')
        if not text:
            return Response({"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = parse_voice_command(text, request.user)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post', 'put', 'patch', 'delete'], url_path='current')
    def current(self, request):
        # Get or create the budget for the user
        budget, created = Budget.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(budget)
            return Response(serializer.data)
        
        elif request.method in ['POST', 'PUT', 'PATCH']:
            serializer = self.get_serializer(budget, data=request.data, partial=(request.method in ['PATCH', 'PUT']))
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        elif request.method == 'DELETE':
            budget.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
