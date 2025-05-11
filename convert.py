import os
import numpy as np
import json

# Set your input and output folders
input_folder = './data'
output_folder = './data_json'

# Make sure output folder exists
os.makedirs(output_folder, exist_ok=True)

# Loop over all .txt files
for filename in os.listdir(input_folder):
    if filename.endswith('.txt'):
        txt_path = os.path.join(input_folder, filename)
        
        # 1. Load the txt file
        try:
            frames_array = np.loadtxt(txt_path)

            # 2. Reshape each frame (1 row) into (32, 64)
            reshaped_frames = frames_array.reshape((-1, 32, 64))

            # 3. (Optional) Only take first 60 frames for lighter visualization
            subset_frames = reshaped_frames[:60]

            # 4. Convert to list
            frames_list = subset_frames.tolist()

            # 5. Save as JSON
            json_filename = filename.replace('.txt', '.json')
            json_path = os.path.join(output_folder, json_filename)
            with open(json_path, 'w') as f:
                json.dump(frames_list, f)

            print(f"Converted {filename} -> {json_filename} ({len(frames_list)} frames)")
        
        except Exception as e:
            print(f"Error processing {filename}: {e}")
