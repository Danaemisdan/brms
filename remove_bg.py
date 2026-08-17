import sys
from rembg import remove
from PIL import Image
import io

input_path = sys.argv[1]
output_path = sys.argv[2]

print(f"Removing background from {input_path}")
with open(input_path, 'rb') as i:
    input_image = i.read()
    output_image = remove(input_image)

with open(output_path, 'wb') as o:
    o.write(output_image)

print(f"Saved background-removed image to {output_path}")
