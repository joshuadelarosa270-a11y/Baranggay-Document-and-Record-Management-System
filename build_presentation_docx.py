import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

from create_doc_helpers import set_cell_background, set_cell_margins, add_callout_box, add_script_box

def create_document():
    doc = Document()
    
    # Page setup - 0.8 inch margins for clean readability
    for sec in doc.sections:
        sec.top_margin = Inches(0.8)
        sec.bottom_margin = Inches(0.8)
        sec.left_margin = Inches(0.8)
        sec.right_margin = Inches(0.8)
        sec.different_first_page_header_footer = False
        
        # Header / Footer
        footer = sec.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("Barangay Wawa BDRMS — Presentation Guide | Pahina ")
        f_run.font.name = "Arial"
        f_run.font.size = Pt(8.5)
        f_run.font.color.rgb = RGBColor(148, 163, 184)
        
    # Helper for adding styled headers
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(15, 39, 68) # Deep navy
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(3, 105, 161) # Blue
        return p

    def add_pointer_table(pointers):
        tbl = doc.add_table(rows=len(pointers) + 1, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        
        col_widths = [Inches(2.2), Inches(4.5)]
        
        headers = ["📍 Saang Part ng Screen Ituturo", "💬 Maikling Paliwanag / I-highlight"]
        hdr_row = tbl.rows[0]
        for idx, text in enumerate(headers):
            cell = hdr_row.cells[idx]
            cell.width = col_widths[idx]
            set_cell_background(cell, "0F2744")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(text)
            run.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)
            
        for row_idx, (part, desc) in enumerate(pointers, start=1):
            row = tbl.rows[row_idx]
            bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, text in enumerate([part, desc]):
                cell = row.cells[col_idx]
                cell.width = col_widths[col_idx]
                set_cell_background(cell, bg_color)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                run = p.add_run(text)
                run.font.name = "Arial"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(30, 41, 59)
                if col_idx == 0:
                    run.bold = True
                    run.font.color.rgb = RGBColor(15, 39, 68)
                    
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ==================== COVER / HEADER ====================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_t = title_p.add_run("BARANGAY WAWA — DOCUMENT & RECORDS MANAGEMENT SYSTEM")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(17)
    run_t.font.color.rgb = RGBColor(15, 39, 68)

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(8)
    run_s = sub_p.add_run("Opisyal na Gabay sa Presentasyon at Walkthrough ng System (Maikli at Humanized)\nAbra de Ilog, Occidental Mindoro | Live Website: https://barangay-wawa-bdrms.vercel.app")
    run_s.font.name = "Arial"
    run_s.font.size = Pt(10)
    run_s.font.color.rgb = RGBColor(100, 116, 139)

    add_callout_box(
        doc,
        "BUOD NG TATLONG ROLES (ISAPUSO BAGO MAG-PRESENT)",
        "1. SECRETARY (Operasyon): Siya lang ang nagrerehistro ng residente at siya ang nag-aapruba ng lahat ng requests.\n"
        "2. ADMIN (Tagasubaybay): Monitor lamang sa pangkalahatang datos, statistics, at audit trail nang walang approval clutter.\n"
        "3. RESIDENT (Aplikante): Kailangang rehistrado muna kay Secretary bago makapag-login; nag-a-apply ng dokumento at nagti-track online.",
        bg_hex="F0FDF4"
    )

    # ==================== BAHAGI 1: LANDING PAGE ====================
    add_h1("BAHAGI 1: ANG LANDING PAGE (PAMPUBLIKONG PORTAL)")
    
    p_desc = doc.add_paragraph()
    p_desc.paragraph_format.space_after = Pt(6)
    p_desc.add_run("Ito ang bumubungad sa kahit sinong mamamayan. Hindi pa kailangang mag-login dito upang makita ang mga serbisyo at proseso ng barangay.")
    
    # Image 1: Landing Hero
    if os.path.exists("img_01_landing_hero.png"):
        doc.add_picture("img_01_landing_hero.png", width=Inches(6.7))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run("Larawan 1: Taas ng Landing Page (Hero, Official Seal, at Navigation CTAs)")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_pointer_table([
        ("Top Navigation Bar (Itaas)", "Ituro ang Selyo ng Barangay Wawa at ang mga navigation link (Mga Dokumento, Paano Mag-apply, I-track ang Status)."),
        ("Resident Portal Button (Asul sa Kanan)", "Ituro ito at sabihing: 'Dito magki-click ang rehistradong residente para pumasok sa kanyang dashboard.'"),
        ("Kawani at Opisyal (Ghost Button sa Kanan)", "Ituro ito at sabihing: 'Dito naman papasok ang Secretary at Admin gamit ang kanilang authorized accounts.'"),
        ("Hero Title at Tagline (Gitna)", "Ituro ang mabilisang serbisyo ng Barangay Wawa, Abra de Ilog, Occidental Mindoro.")
    ])

    add_script_box(
        doc,
        "Magandang araw po sa inyong lahat. Ito po ang opisyal na Landing Page ng aming Barangay Wawa E-Services Portal. "
        "Dito pa lang sa unahan, malinaw nang makikita ng bawat residente ang mga serbisyong inihahatid ng barangay. "
        "Hindi po kailangang mag-login para makita ang impormasyon, presyo, at gabay sa pagkuha ng papeles, "
        "kaya napakalaking tulong ito upang maihanda ng residente ang kanilang kailangan bago pumunta sa Barangay Hall."
    )

    # Image 2: Services & Tracker
    add_h2("1.2 Katalogo ng mga Dokumento at Online Tracker")
    if os.path.exists("img_02_landing_services.png"):
        doc.add_picture("img_02_landing_services.png", width=Inches(6.7))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run("Larawan 2: Talaan ng Dokumento, Bayarin, at Real-time Status Tracker")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_pointer_table([
        ("Cards ng mga Dokumento (Gitna)", "Ituro ang Indigency (Libre), Barangay Clearance (₱50), Residency (₱30), at First Time Jobseeker (Libre sa ilalim ng RA 11261)."),
        ("4-Step Process Stepper (Itaas ng Services)", "Ituro ang 4 na simpleng hakbang: 1. Pumili → 2. Mag-login/Register kay Secretary → 3. Online Review → 4. Kunin sa Hall."),
        ("Tracking Search Bar (Bandang Ibaba)", "Ituro ang input box kung saan ilalagay ang Reference Number (halimbawa: BW-2603-XXXX) at apelyido para malaman ang status agad nang hindi pumipila.")
    ])

    add_script_box(
        doc,
        "Sa bandang ibaba po ng landing page, makikita ang kumpletong listahan ng mga dokumento kasama ang opisyal na bayarin at mga libreng serbisyo tulad ng First Time Jobseeker sa ilalim ng RA 11261. "
        "Mayroon din po tayong built-in Reference Tracker kung saan kahit sino ay pwedeng mag-follow up ng kanilang papeles sa pamamagitan lamang ng kanilang reference number at apelyido."
    )

    # ==================== BAHAGI 2: ROLE NI SECRETARY ====================
    add_h1("BAHAGI 2: ANG ROLE NI SECRETARY (PUSO NG OPERASYON AT APPROVALS)")
    
    add_callout_box(
        doc,
        "PANGUNAHING PANUNTUNAN NG SISTEMA (SECRETARY PRIVILEGE)",
        "Si Secretary Lorna Fernandez lamang ang may pahintulot na: \n"
        "1. Magrehistro ng residente sa opisyal na database ng Barangay Wawa.\n"
        "2. Mag-apruba (Approve) o mag-reject ng mga naipasang kahilingan sa dokumento.",
        bg_hex="FEF3C7"
    )

    if os.path.exists("img_05_secretary_dashboard.png"):
        doc.add_picture("img_05_secretary_dashboard.png", width=Inches(6.7))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run("Larawan 3: Secretary Operations Dashboard — Approval ng Kahilingan at Pagpaparehistro")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_pointer_table([
        ("Pending Requests Table (Gitnang Mesa)", "Ituro ang listahan ng mga bagong dating na request mula sa mga residente online. Ipakita ang reference numbers, pangalan, at purok."),
        ("Action Buttons sa Kanan ng Table", "Ituro ang Berdeng 'Approve' button, Pulang 'Reject', at 'View Details' button kung saan nire-review ni Secretary ang valid ID at blotter verification."),
        ("Sidebar Tab: 'Mga Rehistradong Residente'", "Ituro ang tab sa kaliwa. Dito binubuksan ni Secretary ang form para irehistro ang isang bagong residente na pumunta sa barangay."),
        ("Official Role Badge sa Taas", "Ituro ang nakasulat na 'Sec. L. Fernandez — Kalihim ng Barangay (Operations & Approval)'.")
    ])

    add_script_box(
        doc,
        "Dito naman po tayo sa dashboard ni Secretary Lorna Fernandez. Siya po ang pinakamahalagang user sa araw-araw na operasyon ng barangay. "
        "Lahat po ng request na isinusumite ng residente online ay pumapasok dito bilang 'Submitted' o 'Pending'. "
        "Tungkulin ni Secretary na i-verify kung lehitimong residente, may valid ID, at walang pending blotter bago niya i-click ang 'Approve'. "
        "Bukod dito, si Secretary din po ang tanging nag-e-encode at nagrerehistro ng mga residente upang masigurong walang makakapasok na pekeng account."
    )

    # ==================== BAHAGI 3: ROLE NI ADMIN ====================
    add_h1("BAHAGI 3: ANG ROLE NI ADMIN (EXECUTIVE MONITORING AT AUDIT)")

    if os.path.exists("img_06_admin_dashboard.png"):
        doc.add_picture("img_06_admin_dashboard.png", width=Inches(6.7))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run("Larawan 4: Administrator Portal — Pangkalahatang Monitoring at Transparency Logs")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_pointer_table([
        ("Top Summary Cards (Itaas)", "Ituro ang Kabuuang Residente, Kabuuang Naiprosesong Dokumento, at Revenue/Koleksyon ng Barangay."),
        ("Audit & Activity Logs (Bandang Ibaba)", "Ituro ang live timeline kung saan naitala kung kailan nag-login ang staff, anong dokumento ang na-print, at sinong nag-apruba."),
        ("Wala ang 'Approve/Reject' Clutter", "I-highlight sa panel na walang approval buttons dito dahil si Admin ay tagasubaybay (monitor) lamang upang maiwasan ang conflict of interest.")
    ])

    add_script_box(
        doc,
        "Para naman po kay Admin o Punong Barangay, ang kanyang role po ay purely 'Executive Monitoring'. "
        "Hindi na po siya kailangang maabala sa pag-aapruba ng bawat clearance dahil operasyon na iyon ni Secretary. "
        "Ang tinitingnan ni Admin ay ang 'big picture' — kung ilang residente na ang rehistrado sa bawat purok, gaano kabilis naipoproseso ang mga dokumento, "
        "at ang audit trail para sa transparency at pananagutan ng bawat transaksyon."
    )

    # ==================== BAHAGI 4: ROLE NI RESIDENT ====================
    add_h1("BAHAGI 4: ANG ROLE NI RESIDENT (PORTAL, REQUEST, AT CLAIM STUB)")

    add_callout_box(
        doc,
        "MAHALAGANG TANDAAN SA PAG-LOGIN NG RESIDENTE",
        "Ang isang residente ay HINDI makakagawa ng sariling account sa pamamagitan lamang ng simpleng self-signup. "
        "Dapat muna siyang magtungo sa Barangay Hall kung saan ie-encode ni Secretary ang kanyang detalye (Purok, Residency Date, Contact, ID). "
        "Matapos siyang ma-verify, ibibigay sa kanya ang kanyang Resident Username at Password.",
        bg_hex="F1F5F9"
    )

    if os.path.exists("img_03_resident_login.png"):
        doc.add_picture("img_03_resident_login.png", width=Inches(6.7))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run("Larawan 5: Resident Login Portal na may Opisyal na Paalala sa Pagpaparehistro")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_pointer_table([
        ("Green Notice Banner (Itaas ng Form)", "Ituro ang paalala na ang opisyal na rehistro ay pinamamahalaan ng Tanggapan ng Kalihim ng Barangay Wawa."),
        ("Login Fields (Gitna)", "Ituro kung saan inilalagay ang Username o Mobile Number at Password."),
        ("1-Click Demo Accounts (Bandang Ibaba)", "Ituro ang sample registered resident (halimbawa: Kristine Navarro ng Purok 2) na pwedeng i-click para sa agarang live demo.")
    ])

    add_script_box(
        doc,
        "Dito naman po sa Resident Portal, makikita ang login interface para sa mga mamamayan. "
        "May malinaw pong paalala rito na kailangan munang magparehistro kay Secretary bago makapasok. "
        "Ito po ay upang masiguro nating lehitimong taga-Barangay Wawa lamang ang makakakuha ng mga sertipiko at clearance."
    )

    # Image 4: Resident Dashboard
    add_h2("4.2 Personal Dashboard ng Residente")
    if os.path.exists("img_04_resident_dashboard.png"):
        doc.add_picture("img_04_resident_dashboard.png", width=Inches(6.7))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run("Larawan 6: Resident Dashboard — Live Status, Claim Stub, at Pag-apply ng Papeles")
        run_cap.italic = True
        run_cap.font.size = Pt(8.5)
        run_cap.font.color.rgb = RGBColor(100, 116, 139)

    add_pointer_table([
        ("Profile Hero Banner (Itaas)", "Ituro ang buong pangalan ng residente, kanyang Purok, at tagal ng paninirahan sa Barangay Wawa."),
        ("Button na 'Mag-apply ng Dokumento' (Kanan)", "Ituro ito at sabihing: 'Kapag pinindot ito, lalabas ang mabilisang modal form kung saan pipiliin ang dokumento at layunin.'"),
        ("Talaan ng mga Kahilingan (Gitna)", "Ituro ang status badges: 'Ready for Pickup' (Inaprubahan na) o 'Submitted' (Pinoproseso pa)."),
        ("Claim Stub Button", "Ituro ito at ipakitang may downloadable at printable claim stub na may QR code para mabilis na ma-claim sa Barangay Hall.")
    ])

    add_script_box(
        doc,
        "Pagkapasok po ni Resident sa kanyang dashboard, kitang-kita niya ang kanyang beripikadong profile at ang listahan ng lahat ng kanyang mga na-apply na dokumento. "
        "Hindi na po niya kailangang mag-alala kung ano nang nangyari sa kanyang clearance dahil live na nag-u-update ang status mula 'Submitted' papuntang 'Ready for Pickup'. "
        "Mayroon din po siyang printable Claim Stub na may QR code na dadalhin na lamang niya sa Barangay Hall para sa mabilisang releasing."
    )

    # ==================== BAHAGI 5: SUMMARY AT CLOSING ====================
    add_h1("BAHAGI 5: BUOD NG DALOY AT PANGHULING PANANALITA")

    add_callout_box(
        doc,
        "ANG PINASIMPLENG DALOY SA ISANG TINGIN (FLOW SUMMARY)",
        "LANDING PAGE (Pampubliko, walang login)\n"
        "   ↓\n"
        "SECRETARY (Nagrerehistro ng Residente sa Hall)\n"
        "   ↓\n"
        "RESIDENT LOGIN (Papasok gamit ang ibinigay na account)\n"
        "   ↓\n"
        "RESIDENT DASHBOARD (Mag-a-apply ng dokumento mula sa bahay)\n"
        "   ↓\n"
        "SECRETARY DASHBOARD (Re-reviewhin at I-a-approve ang request)\n"
        "   ↓\n"
        "ADMIN DASHBOARD (Mamo-monitor ang kabuuang rekord at statistics)\n"
        "   ↓\n"
        "CLAIM STUB & RELEASING (Kukunin ng residente sa Barangay Hall nang walang mahabang pila)",
        bg_hex="EFF6FF"
    )

    add_script_box(
        doc,
        "Sa kabuuan po, ang sistemang ito ay binuo upang alisin ang red-tape, pabilisin ang serbisyo, at tiyakin ang integridad ng bawat dokumento sa Barangay Wawa. "
        "Si Secretary ang nagpapanatili ng legalidad at kaayusan ng operasyon, si Admin ang nagsisiguro ng transparency sa monitoring, "
        "at ang bawat mamamayan ay nabibigyan ng modernong serbisyong mabilis, ligtas, at maaasahan. "
        "Maraming salamat po at bukas po kami sa inyong mga katanungan."
    )

    output_path = r"c:\midterm project\Gabay_sa_Presentasyon_BDRMS.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
