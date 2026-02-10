from itertools import combinations

expenses = [
    369.00, 1800.00, 149.00, 885.00, 173.00, 221.00, 1453.00, 58.00, 160.00, 
    938.30, 467.50, 86.22, 760.00, 117.00, 330.00, 530.15, 1360.00, 6.00, 
    87.52, 504.00, 132.00, 601.00, 994.00, 360.00, 350.00, 800.00, 110.00, 
    295.00, 53.00, 165.00, 870.00, 166.00, 348.00, 460.00, 449.00, 119.00, 
    346.62, 600.00, 17850.00, 280.00, 850.00, 1500.00, 165.00, 27.00, 
    1305.00, 109.00, 690.00, 18000.00
]

target = 2131.00
tolerance = 0.01

print(f"Searching for subset sum close to {target}...")

for r in range(1, 5): # Check combinations of up to 4 items
    for c in combinations(expenses, r):
        if abs(sum(c) - target) < tolerance:
            print(f"Found match: {c} = {sum(c)}")
