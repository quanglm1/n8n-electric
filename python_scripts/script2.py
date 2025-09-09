import sys
import pandas as pd

# Usage: python script2.py input.xlsx output.xlsx
if len(sys.argv) != 3:
    print("Usage: python script2.py <input.xlsx> <output.xlsx>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

df = pd.read_excel(input_file)
# Tính tổng cột 'B'
total = df['B'].sum()

# Ghi kết quả ra file Excel mới
result = pd.DataFrame({'Total_B': [total]})
result.to_excel(output_file, index=False)
print(f"Sum of column B saved to {output_file}")
