import os
import time
from html2image import Html2Image

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
hti = Html2Image(browser_executable=edge_path, output_path='.')

# 1. Landing Hero (already captured, but ensure best framing)
hti.screenshot(url='https://barangay-wawa-bdrms.vercel.app/', save_as='img_01_landing_hero.png', size=(1280, 720))
print("1. Hero captured")

# 2. Landing Services & 4-Step Process & Tracker
hti.screenshot(url='https://barangay-wawa-bdrms.vercel.app/#services', save_as='img_02_landing_services.png', size=(1280, 850))
print("2. Services captured")

# 3. Resident Login & Secretary Registration Notice
hti.screenshot(url='https://barangay-wawa-bdrms.vercel.app/resident-login.html', save_as='img_03_resident_login.png', size=(1280, 760))
print("3. Resident Login captured")

# 4. Resident Dashboard (Kristine Navarro)
local_res = os.path.abspath('temp_res.html')
hti.screenshot(url=f'file:///{local_res}', save_as='img_04_resident_dashboard.png', size=(1280, 800))
print("4. Resident Dashboard captured")

# 5. Secretary Operations Dashboard (Approve / Reject / Register)
local_sec = os.path.abspath('temp_sec.html')
hti.screenshot(url=f'file:///{local_sec}', save_as='img_05_secretary_dashboard.png', size=(1280, 820))
print("5. Secretary Dashboard captured")

# 6. Admin Monitoring Dashboard (Overview / Audit / Statistics)
local_adm = os.path.abspath('temp_adm.html')
hti.screenshot(url=f'file:///{local_adm}', save_as='img_06_admin_dashboard.png', size=(1280, 820))
print("6. Admin Dashboard captured")

print("ALL SCREENSHOTS CAPTURED SUCCESSFULLY!")
