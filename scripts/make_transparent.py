from PIL import Image
import os

def remove_bg(input_path, output_path, tolerance=50):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    # Sample top-left pixel to get the background color
    bg_color = datas[0]
    print(f"Sampled bg color: {bg_color}")
    
    new_data = []
    for item in datas:
        # Calculate distance
        dist = sum(abs(item[i] - bg_color[i]) for i in range(3))
        if dist < tolerance:
            # calculate alpha based on distance for smooth edges? 
            # Simple approach first:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_bg("public/logo-circle.jpg", "public/logo-circle-transparent.png")
remove_bg("public/logo-book.jpg", "public/logo-book-transparent.png")
