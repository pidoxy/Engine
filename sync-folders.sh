# sync-folders.sh
git checkout your-branch
git fetch origin
for folder in folder1 folder2 folder3; do
    git checkout origin/main -- $folder
done
git commit -m "Sync selected folders from main"
