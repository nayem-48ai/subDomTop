pkg update && pkg upgrade
pkg install git
clear
termux-setup-storage
mkdir subDomTop
cp /storage/emulated/0/Download/project.zip subDomTop/
cd subDomTop
git init
git add project.zip
git commit -m "Upload project zip"
git branch -M main
git remote add origin https://github.com/nayem-48ai/subDomTop.git
git push -u origin main
clear
git config --global user.email "mdtorikulislam5748@gmail.com"
git config --global user.name "nayem-48ai"
git add project.zip
git commit -m "Upload project zip"
git push -u origin main
pkg install unzip
unzip project.zip
rm project.zip
git add .
git commit -m "Upload extracted project files"
git push -u origin main
git push -u origin main --force
clear
git add .
git commit -m "Update project: added new features"
git push origin main
git add .
git commit -m "Update project: added new features"
git push origin main
git config --global credential.helper store
nano setup_project.sh
chmod +x setup_project.sh
./setup_project.sh
rm setup_project.sh
pkg install python
nano extractor.py
nano project.txt
python extractor.py
clear
python builder.py
clear
python builder.py
exit
