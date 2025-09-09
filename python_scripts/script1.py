import sys
import pandas as pd

# Usage: python script1.py input.xlsx output.xlsx
if len(sys.argv) != 3:
    print("Usage: python script1.py <input.xlsx> <output.xlsx>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

df = pd.read_excel(input_file)
# Lọc các dòng có giá trị cột 'A' > 10
filtered = df[df['A'] > 10]
filtered.to_excel(output_file, index=False)
print(f"Filtered rows saved to {output_file}")
