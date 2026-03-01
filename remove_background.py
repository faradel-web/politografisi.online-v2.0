import sys
from PIL import Image

def make_transparent(input_file, output_file):
    print(f"Processing {input_file}...")
    img = Image.open(input_file).convert("RGBA")
    data = img.getdata()
    
    width, height = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((width-1, 0)),
        img.getpixel((0, height-1)),
        img.getpixel((width-1, height-1))
    ]
    # Simple heuristic to find background color (assuming mostly solid)
    bg_color = max(set(corners), key=corners.count)
    
    new_data = []
    
    # Very conservative tolerance because the image has a white background
    tolerance = 15
    soft_edge_range = 30
    
    for item in data:
        # Euclidean-like distance approximation
        dist = sum(abs(a - b) for a, b in zip(item[:3], bg_color[:3]))
        
        if dist <= tolerance:
            # Transparent
            new_data.append((255, 255, 255, 0))
        elif dist <= tolerance + soft_edge_range:
            # Soft edge / anti-aliasing
            alpha = int(((dist - tolerance) / soft_edge_range) * 255)
            # Try to recover original color instead of whitening it, just add alpha
            new_data.append((item[0], item[1], item[2], alpha))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_file, "PNG")
    print(f"Saved to {output_file}")

try:
    make_transparent("public/logo-circle.jpg", "public/logo-circle.png")
    make_transparent("public/logo-book.jpg", "public/logo-book.png")
except Exception as e:
    print(f"Error: {e}")
