import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    """Set internal padding for table cells (in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def create_document():
    doc = Document()

    # Configure Margins (Normal: 1 inch = 72 pt)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Venduo MVP · Auditoría de Producto vs. VENDUO.md")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(120, 120, 120)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Venduo — Tu tienda online con red de vendedores a comisión")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(140, 140, 140)

    # Palette
    C_PRIMARY = RGBColor(22, 23, 26)     # #16171a (Tinta)
    C_RED = RGBColor(217, 56, 30)        # #d9381e (Señal)
    C_GRAY = RGBColor(90, 95, 105)       # Muted text
    C_GREEN = RGBColor(24, 134, 75)      # Hecho
    C_AMBER = RGBColor(194, 110, 0)      # Parcial
    C_DARK_RED = RGBColor(175, 30, 20)   # Pendiente

    # Base Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = C_PRIMARY
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # --- COVER / HEADER TITLE ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(2)
    run_badge = title_p.add_run("INFORME DE ESTADO DE PRODUCTO\n")
    run_badge.font.size = Pt(9)
    run_badge.font.bold = True
    run_badge.font.color.rgb = C_RED

    run_title = title_p.add_run("Venduo MVP: Funcionalidades Hechas vs. Pendientes")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = C_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    sub_run = sub_p.add_run("Evaluación de avance técnico y funcional basada en la especificación maestra VENDUO.md")
    sub_run.font.size = Pt(11.5)
    sub_run.font.italic = True
    sub_run.font.color.rgb = C_GRAY

    # Metadata box
    meta_table = doc.add_table(rows=1, cols=1)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_cell = meta_table.cell(0, 0)
    set_cell_background(meta_cell, "F5F5F3")
    set_cell_margins(meta_cell, top=140, bottom=140, left=180, right=180)
    
    mp = meta_cell.paragraphs[0]
    mp.paragraph_format.space_after = Pt(0)
    m_run = mp.add_run(
        "• Proyecto: Venduo (Hackathon 48 horas · Empleabilidad Juvenil & Triple Impacto)\n"
        "• Fuente de verdad: VENDUO.md\n"
        "• Stack tecnológico: Next.js 15 (App Router), Supabase (PostgreSQL, RLS, Storage), Tailwind v4, Capa IA multi-proveedor\n"
        "• Fecha del reporte: Septiembre 2026"
    )
    m_run.font.size = Pt(9.5)
    m_run.font.color.rgb = RGBColor(50, 50, 50)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # --- SECCIÓN 1: RESUMEN EJECUTIVO ---
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    h1_run = h1.add_run("1. Resumen Ejecutivo del Estado del Proyecto")
    h1_run.font.size = Pt(14)
    h1_run.font.bold = True
    h1_run.font.color.rgb = C_PRIMARY

    p_intro = doc.add_paragraph(
        "Venduo tiene como propósito convertir a cualquier emprendedor en una tienda online en minutos y proporcionarle una red de vendedores jóvenes que comercializan sus productos a comisión, generando para ellos su primer historial laboral verificable.\n\n"
        "De los 14 puntos de alcance del MVP especificados en VENDUO.md §6:"
    )
    
    # Bullet points with stats
    b1 = doc.add_paragraph(style='List Bullet')
    r = b1.add_run("6 funcionalidades (43%) están 100% terminadas y operativas en frontend y backend: ")
    r.font.bold = True
    b1.add_run("Autenticación por rol, Onboarding de tienda y selección de plantillas, Alta de vendedor, Panel del vendedor con materiales QR/WhatsApp, Historial laboral verificable en URL pública y la Inteligencia de Negocio con IA.")

    b2 = doc.add_paragraph(style='List Bullet')
    r = b2.add_run("3 funcionalidades (21%) tienen el backend, base de datos e IA listos, pero esperan pantalla: ")
    r.font.bold = True
    b2.add_run("Gestión de productos con condición nuevo/usado, confirmación de pedidos con comprobante QR y generación de copys de marketing para Facebook/WhatsApp. Actualmente muestran una vista de 'Sección Pendiente'.")

    b3 = doc.add_paragraph(style='List Bullet')
    r = b3.add_run("5 funcionalidades (36%) pertenecen al circuito de la tienda pública, checkout y editor IA: ")
    r.font.bold = True
    b3.add_run("La tienda pública móvil (/t/[slug]), el carrito de compra, el checkout con QR, el chat de edición visual de bloques y el bloqueo tras 14 días.")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECCIÓN 2: TABLA MATRIZ DE LOS 14 PUNTOS ---
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    h2_run = h2.add_run("2. Matriz de los 14 Puntos del Alcance del MVP (VENDUO.md §6)")
    h2_run.font.size = Pt(14)
    h2_run.font.bold = True
    h2_run.font.color.rgb = C_PRIMARY

    items_mvp = [
        ("1", "Registro y login del emprendedor", "Hecho", "22C55E", "/login con Supabase Auth, correo y contraseña. Selección explícita entre emprendedor y vendedor."),
        ("2", "Selección de plantilla según rubro", "Hecho", "22C55E", "/crear con galería visual por sectores y formulario /crear/negocio con slug y WhatsApp."),
        ("3", "Edición de tienda asistida por IA", "Pendiente UI", "F59E0B", "Base de datos y esquemas de IA listos (block_types, store_blocks). Falta la pantalla de chat con el modelo para aplicar operaciones."),
        ("4", "Tienda pública real en móvil (/t/{slug})", "Falta", "EF4444", "Ruta /t/[slug] no construida aún. Solo existe la maqueta interactiva en la portada."),
        ("5", "Gestión de productos (nuevos / segunda mano)", "Pendiente UI", "F59E0B", "Tabla products y storage listos. Falta sustituir el cartel de /panel/productos por el formulario CRUD."),
        ("6", "Carrito y checkout con datos del cliente", "Falta", "EF4444", "Función create_order lista en SQL. Falta la UI de carrito y checkout en la tienda pública."),
        ("7", "Pago por QR con pasarela simulada", "Parcial", "F59E0B", "QR configurable en /cuenta y generador en lib/qr.ts. Falta el paso en checkout para adjuntar comprobante."),
        ("8", "Alta de vendedor con enlace propio", "Hecho", "22C55E", "/sumarme genera referral_code, vínculo en store_sellers y perfil público."),
        ("9", "Atribución de venta mediante enlace ?ref=", "Backend Listo", "F59E0B", "create_order en Postgres ya atribuye y valida el código. Falta conectarlo a la URL del checkout."),
        ("10", "Cálculo automático de comisión", "Hecho", "22C55E", "Congelado estricto en centavos y puntos básicos (bps) en create_order; nunca se recalcula después."),
        ("11", "Panel del vendedor: ventas y materiales", "Hecho", "22C55E", "/vendedor con tarjetas de ganancias, QR descargable, kit WhatsApp y tabla de comisiones."),
        ("12", "Inteligencia de negocio con IA", "Hecho", "22C55E", "/panel/estadisticas con consultas en lenguaje natural, vistas seguras mis_*, gráficos dinámicos y PDF."),
        ("13", "Generador de copys de marketing con IA", "Pendiente UI", "F59E0B", "Tarea generateMarketingCampaign en lib/ai/tasks.ts lista. Falta UI en /panel/marketing."),
        ("14", "Coordinación de entrega por WhatsApp", "Pendiente UI", "F59E0B", "Falta pantalla en /panel/pedidos para ver comprobante QR y botón con enlace directo a WhatsApp.")
    ]

    t = doc.add_table(rows=1, cols=4)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = t.rows[0].cells
    hdr_titles = ["#", "Requerimiento VENDUO.md", "Estado", "Detalle de Implementación"]
    col_widths = [Inches(0.4), Inches(2.2), Inches(1.1), Inches(2.8)]
    
    for i, title in enumerate(hdr_titles):
        cell = hdr_cells[i]
        cell.width = col_widths[i]
        set_cell_background(cell, "16171A")
        set_cell_margins(cell, top=140, bottom=140, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(title)
        run.font.bold = True
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(255, 255, 255)

    for num, req, est, color, det in items_mvp:
        row = t.add_row()
        cells = row.cells
        for i in range(4):
            cells[i].width = col_widths[i]
            set_cell_margins(cells[i], top=100, bottom=100, left=100, right=100)
        
        # Col 0: num
        p0 = cells[0].paragraphs[0]
        p0.add_run(num).font.size = Pt(9)
        
        # Col 1: req
        p1 = cells[1].paragraphs[0]
        r1 = p1.add_run(req)
        r1.font.bold = True
        r1.font.size = Pt(9)
        
        # Col 2: est
        p2 = cells[2].paragraphs[0]
        r2 = p2.add_run(est)
        r2.font.bold = True
        r2.font.size = Pt(8.5)
        if est == "Hecho":
            r2.font.color.rgb = C_GREEN
        elif "Pendiente" in est or "Parcial" in est or "Backend" in est:
            r2.font.color.rgb = C_AMBER
        else:
            r2.font.color.rgb = C_DARK_RED
            
        # Col 3: det
        p3 = cells[3].paragraphs[0]
        p3.add_run(det).font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- SECCIÓN 3: DETALLE DE LO 100% HECHO ---
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)
    h3_run = h3.add_run("3. Detalle de Funcionalidades 100% Terminadas")
    h3_run.font.size = Pt(14)
    h3_run.font.bold = True
    h3_run.font.color.rgb = C_PRIMARY

    def add_feature_card(title, url, description, highlights):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(f"• {title}")
        r_title.font.bold = True
        r_title.font.size = Pt(11)
        r_title.font.color.rgb = C_PRIMARY

        r_url = p.add_run(f"  [{url}]")
        r_url.font.size = Pt(9)
        r_url.font.italic = True
        r_url.font.color.rgb = C_RED

        p_desc = doc.add_paragraph(description)
        p_desc.paragraph_format.space_after = Pt(2)
        
        for h in highlights:
            bp = doc.add_paragraph(style='List Bullet')
            bp.paragraph_format.space_after = Pt(1)
            r = bp.add_run(h)
            r.font.size = Pt(9.5)

    add_feature_card(
        "Autenticación con Elección de Rol",
        "/login",
        "Sistema de autenticación sobre Supabase Auth optimizado para baja fricción.",
        [
            "Registro sin verificación de correo para evitar abandono en celulares.",
            "Elección de intención obligatoria: 'Tengo un negocio' o 'Quiero vender'.",
            "Modo Demo activo si no hay credenciales de Supabase en el entorno local.",
            "Cierre de sesión seguro y protección de rutas en middleware."
        ]
    )

    add_feature_card(
        "Onboarding de Tienda y Catálogo de Plantillas",
        "/crear y /crear/negocio",
        "Alta del comerciante dividida en selección estética y parámetros del negocio.",
        [
            "Galería de plantillas agrupadas por rubro (Minimalista, Artesanal, Audaz, Sobria).",
            "Generador de slug con normalización de acentos y caracteres especiales.",
            "Configuración del porcentaje de comisión para la red en puntos básicos (bps).",
            "Teléfono de WhatsApp para la futura coordinación de ventas."
        ]
    )

    add_feature_card(
        "Panel del Vendedor y Kit de Afiliación",
        "/vendedor",
        "Pantalla integral para el vendedor que trabaja para múltiples tiendas.",
        [
            "Resumen financiero en tiempo real: comisiones ganadas, ventas cerradas y volumen transaccionado.",
            "Generador de enlaces con código de referido (?ref=codigo) y código QR personal.",
            "Botones de copiado de materiales de venta listos para WhatsApp.",
            "Tabla de seguimiento de comisiones en sus 4 estados: Pendiente, Confirmada, Pagada y Anulada."
        ]
    )

    add_feature_card(
        "Historial Laboral Verificable del Vendedor",
        "/v/[slug]",
        "Página pública permanente y a prueba de manipulación que sirve como antecedente de trabajo.",
        [
            "Acceso público universal: no requiere tener cuenta para ser auditado por terceros.",
            "Inviolable: las cifras son calculadas por Postgres (seller_public_stats) desde ventas confirmadas.",
            "Resistencia al borrado: si una tienda cierra, el historial del vendedor sobrevive intacto."
        ]
    )

    add_feature_card(
        "Inteligencia de Negocio con IA y Reportes PDF",
        "/panel/estadisticas",
        "Consola de analítica donde el comerciante pregunta en lenguaje natural boliviano.",
        [
            "Motor de consulta segura (run_insight_sql): corre en transacción READ ONLY con RLS.",
            "Aislamiento estricto contra vistas mis_* (el store_id no existe en la vista, previniendo fugas).",
            "Gráficos dinámicos interactivos (barras, líneas, áreas, números clave y tablas).",
            "Generación y descarga de informes profesionales en PDF mediante @react-pdf/renderer.",
            "Soporte para Google Gemini, Anthropic Claude, OpenAI y proveedor Mock simulado."
        ]
    )

    add_feature_card(
        "Vitrinas Públicas de Afiliación (Marketplace)",
        "/explorar/tiendas y /explorar/productos",
        "Directorio para que los jóvenes encuentren tiendas o productos comisionables.",
        [
            "Catálogo de tiendas abiertas a red con visualización de la tasa de comisión ofrecida.",
            "Vitrina de productos comisionables (seller_enabled) con buscador en vivo y cálculo de comisión en Bs.",
            "Acción de 'Tomar producto' con vinculación automática de afiliado."
        ]
    )

    add_feature_card(
        "Gestión de Cuenta, Perfil y Cobro por QR",
        "/cuenta",
        "Centro de ajustes de perfil personal y parámetros financieros de la tienda.",
        [
            "Subida y previsualización de Avatar en Supabase Storage (bucket avatars).",
            "Simulador interactivo del reparto de ganancias según la comisión configurada.",
            "Registro de cuenta bancaria y carga de imagen del código QR de cobro propio."
        ]
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- SECCIÓN 4: PENDIENTES DE PANTALLA ---
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)
    h4_run = h4.add_run("4. Funcionalidades con Backend/IA Listo (Falta Interfaz de Usuario)")
    h4_run.font.size = Pt(14)
    h4_run.font.bold = True
    h4_run.font.color.rgb = C_PRIMARY

    p_pnd = doc.add_paragraph(
        "Estas funcionalidades ya cuentan con soporte en base de datos, tipos TypeScript y lógica de negocio, pero sus rutas actuales muestran el componente SeccionPendiente:"
    )

    add_feature_card(
        "Catálogo y CRUD de Productos",
        "/panel/productos",
        "Permitirá al comerciante gestionar su inventario con soporte para segunda mano.",
        [
            "Estado backend: La tabla products ya tiene condition (nuevo, segunda_mano, reacondicionado), condition_note, compare_at_price_cents, stock y seller_enabled.",
            "Qué falta construir: Formulario para añadir/editar producto, subida de foto al bucket de storage, selector de condición para activar el descuento destacado y control de inventario."
        ]
    )

    add_feature_card(
        "Gestión de Pedidos y Coordinación por WhatsApp",
        "/panel/pedidos",
        "Permitirá revisar pagos entrantes y abrir WhatsApp con el pedido pre-redactado.",
        [
            "Estado backend: Las tablas orders, order_items y las políticas de consulta ya existen.",
            "Qué falta construir: Listado de pedidos recibidos, visor del comprobante de pago QR subido por el comprador, botón para cambiar estado a pagado y botón 'Coordinar entrega' que abra WhatsApp con el detalle del pedido ya formateado."
        ]
    )

    add_feature_card(
        "Generador de Marketing con IA",
        "/panel/marketing",
        "Creación de copys para redes sociales adaptados al catálogo del negocio.",
        [
            "Estado backend: La función generateMarketingCampaign en lib/ai/tasks.ts y sus esquemas Zod ya generan textos para Facebook y WhatsApp.",
            "Qué falta construir: Pantalla para elegir un producto del catálogo, botón para solicitar sugerencias a la IA, y botones de 'Copiar al portapapeles' y 'Compartir en redes' (Plan B de Meta)."
        ]
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- SECCIÓN 5: LO QUE FALTA POR CONSTRUIR ---
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(6)
    h5_run = h5.add_run("5. Funcionalidades Pendientes por Construir")
    h5_run.font.size = Pt(14)
    h5_run.font.bold = True
    h5_run.font.color.rgb = C_PRIMARY

    items_faltantes = [
        ("Tienda Pública del Emprendedor (/t/[slug])",
         "La página web real donde los clientes compran. Debe renderizar la plantilla elegida, los bloques visuales, el catálogo con filtro de segunda mano y el enlace de contacto."),
        ("Carrito de Compras y Checkout Móvil",
         "Componente flotante que recolecta los productos seleccionados y despliega el formulario de compra solicitando nombre y teléfono del cliente (datos obligatorios para WhatsApp)."),
        ("Detección de Referido y Checkout con QR",
         "El checkout debe leer el parámetro ?ref= de la URL, pasárselo a la función create_order en PostgreSQL, desplegar el QR de cobro de la tienda y permitir al comprador adjuntar su comprobante de pago."),
        ("Editor Visual de Bloques con Asistente IA",
         "Interfaz en el panel donde el usuario le pide cambios a la tienda por texto (ej. 'haz el banner más llamativo', 'agrega una sección de preguntas') y la IA genera operaciones sobre store_blocks con opción de deshacer."),
        ("Rutina de Vencimiento de Suscripción (14 días)",
         "Mecanismo que, al expirar el período de prueba, bloquee la tienda pública y habilite únicamente la exportación de todos los datos en archivo CSV.")
    ]

    for tit, desc in items_faltantes:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(f"❌ {tit}")
        r.font.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = C_DARK_RED
        
        pd = doc.add_paragraph(desc)
        pd.paragraph_format.space_after = Pt(4)
        pd.style = 'List Bullet'

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- SECCIÓN 6: FUERA DE ALCANCE ---
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(6)
    h6_run = h6.add_run("6. Lo que NO se Construye (Fuera de Alcance - VENDUO.md §7)")
    h6_run.font.size = Pt(14)
    h6_run.font.bold = True
    h6_run.font.color.rgb = C_PRIMARY

    p_fa = doc.add_paragraph(
        "Para resguardar los tiempos del hackathon de 48 horas, VENDUO.md establece explícitamente qué NO debe desarrollarse:"
    )

    fa_items = [
        ("Multi-tienda por usuario: ", "Un usuario = una única tienda. Simplifica el aislamiento RLS a una comparación directa."),
        ("Gestión de envíos y logística: ", "La entrega física se coordina directamente por WhatsApp entre comprador y vendedor; la plataforma solo arma el mensaje."),
        ("Cobro de suscripción con tarjeta: ", "Se modela el ciclo de vida (trial, active, blocked), pero no la pasarela de suscripción recurrente."),
        ("Notificaciones por email: ", "Todo el contacto operativo se centraliza en WhatsApp y el navegador."),
        ("Aplicación móvil nativa: ", "La plataforma web es 100% responsive para teléfonos móviles."),
        ("Tests automatizados: ", "Se prioriza la validación manual y tipos estrictos de TypeScript sobre suites de testing.")
    ]

    for tit, desc in fa_items:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        r = bp.add_run(tit)
        r.font.bold = True
        bp.add_run(desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # --- SECCIÓN 7: GUÍA RÁPIDA DE PRUEBAS ---
    h7 = doc.add_paragraph()
    h7.paragraph_format.space_before = Pt(14)
    h7.paragraph_format.space_after = Pt(6)
    h7_run = h7.add_run("7. Checklist Rápido para Quien Pruebe la Aplicación")
    h7_run.font.size = Pt(14)
    h7_run.font.bold = True
    h7_run.font.color.rgb = C_PRIMARY

    checklist = [
        ("Portada (/): ", "Probar la demo interactiva de tienda alternando plantillas visuales y revisar preguntas frecuentes."),
        ("Login (/login): ", "Comprobar la bifurcación de roles ('Tengo un negocio' vs 'Quiero vender') y el ingreso."),
        ("Alta Emprendedor (/crear): ", "Elegir plantilla, completar /crear/negocio y verificar la generación del slug y QR."),
        ("Panel Emprendedor (/panel): ", "Revisar tareas pendientes, banner de suscripción de 14 días y código QR de tienda."),
        ("Red de Vendedores (/panel/vendedores): ", "Copiar enlace de invitación y revisar tabla de comisiones congeladas."),
        ("Estadísticas con IA (/panel/estadisticas): ", "Escribir preguntas en lenguaje natural, ver gráficos dinámicos y descargar el reporte en PDF."),
        ("Vitrinas de Afiliación (/explorar): ", "Ver tiendas abiertas (/explorar/tiendas) y buscar productos comisionables (/explorar/productos)."),
        ("Panel Vendedor (/vendedor): ", "Consultar ventas acumuladas, copiar enlaces con ?ref= y kit para WhatsApp."),
        ("Historial Público (/v/[slug]): ", "Abrir en modo incógnito para verificar que el antecedente laboral es público e inviolable."),
        ("Ajustes (/cuenta): ", "Cargar foto de perfil en Supabase Storage y configurar datos bancarios con QR de cobro.")
    ]

    for tit, desc in checklist:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_after = Pt(2)
        bp.add_run("☐ ").font.bold = True
        r = bp.add_run(tit)
        r.font.bold = True
        bp.add_run(desc)

    # Save to disk
    output_path = os.path.join(os.getcwd(), "Estado_Venduo_MVP_Funcionalidades.docx")
    doc.save(output_path)
    print(f"Document created successfully at: {output_path}")

if __name__ == "__main__":
    create_document()
