# In builder stage
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
# Now, your requirements.txt should NOT list torch, torchvision, torchaudio
# OR if it does, they must be compatible versions.
# It's cleaner to remove them from requirements.txt if installing explicitly like this.
RUN pip install --no-cache-dir -r requirements.txt 