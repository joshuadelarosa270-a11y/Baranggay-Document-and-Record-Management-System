import os
import time
from html2image import Html2Image

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
hti = Html2Image(browser_executable=edge_path, output_path='.')

# Helper for Secretary
with open('temp_sec.html', 'w', encoding='utf-8') as f:
    f.write("""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script>
sessionStorage.setItem('bdrms_staff_session', JSON.stringify({ username: 'secretary', last: Date.now() }));
window.location.replace('https://barangay-wawa-bdrms.vercel.app/admin.html');
</script>
</body>
</html>""")

# Helper for Admin
with open('temp_adm.html', 'w', encoding='utf-8') as f:
    f.write("""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script>
sessionStorage.setItem('bdrms_staff_session', JSON.stringify({ username: 'admin', last: Date.now() }));
window.location.replace('https://barangay-wawa-bdrms.vercel.app/admin.html');
</script>
</body>
</html>""")

# Helper for Resident Dashboard
with open('temp_res.html', 'w', encoding='utf-8') as f:
    f.write("""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script>
localStorage.setItem('bdrms_resident_session', JSON.stringify({ username: 'kristine.navarro', last: Date.now() }));
window.location.replace('https://barangay-wawa-bdrms.vercel.app/resident-dashboard.html');
</script>
</body>
</html>""")

print("Helper files successfully generated.")
