from PIL import Image, ImageDraw
import os

# Crear carpeta de íconos si no existe
os.makedirs('static/icons', exist_ok=True)

# Tamaños necesarios para PWA
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

def crear_icono(tamaño):
    """Crea un ícono con diseño de calendario"""
    
    # Crear imagen con fondo gradiente
    img = Image.new('RGB', (tamaño, tamaño), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Agregar gradiente
    for y in range(tamaño):
        r = int(102 + (118 - 102) * y / tamaño)
        g = int(126 + (75 - 126) * y / tamaño)
        b = int(234 + (162 - 234) * y / tamaño)
        draw.line([(0, y), (tamaño, y)], fill=(r, g, b))
    
    # Dibujar un calendario simple
    margen = tamaño // 8
    ancho = tamaño - 2 * margen
    alto = tamaño - 2 * margen
    
    # Fondo blanco del calendario
    draw.rounded_rectangle(
        [margen, margen, margen + ancho, margen + alto],
        radius=tamaño // 20,
        fill='white'
    )
    
    # Parte superior azul
    draw.rounded_rectangle(
        [margen, margen, margen + ancho, margen + alto // 4],
        radius=tamaño // 20,
        fill='#667eea'
    )
    
    # Cuadrícula de días
    celda_ancho = ancho // 7
    celda_alto = (alto - alto // 4) // 5
    inicio_y = margen + alto // 4
    
    for fila in range(5):
        for col in range(7):
            x1 = margen + col * celda_ancho
            y1 = inicio_y + fila * celda_alto
            x2 = x1 + celda_ancho - 2
            y2 = y1 + celda_alto - 2
            
            # Alternar colores
            if (fila + col) % 2 == 0:
                color = '#f0f0f0'
            else:
                color = 'white'
            
            draw.rectangle([x1, y1, x2, y2], fill=color)
    
    # Dibujar algunos puntos de colores (eventos)
    colores_eventos = ['#10b981', '#f59e0b', '#ef4444']
    for i in range(5):
        x = margen + (i * 2 + 1) * celda_ancho
        y = inicio_y + (i % 5) * celda_alto + celda_alto // 2
        radio = tamaño // 40
        draw.ellipse(
            [x - radio, y - radio, x + radio, y + radio],
            fill=colores_eventos[i % 3]
        )
    
    # Guardar
    filename = f'static/icons/icon-{tamaño}x{tamaño}.png'
    img.save(filename, 'PNG')
    print(f'✓ Ícono creado: {filename}')

# Generar todos los íconos
print('🎨 Generando íconos para PWA...')
for tamaño in sizes:
    crear_icono(tamaño)

print('\n✅ Todos los íconos fueron generados exitosamente!')
print('📁 Los íconos están en: static/icons/')
print('\n📱 Ahora tu app está lista para instalarse en Android e iOS')