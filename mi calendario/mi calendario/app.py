from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///calendario.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo de Evento
class Evento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    color = db.Column(db.String(7), default='#3788d8')
    completado = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'fecha_fin': self.fecha_fin.isoformat(),
            'color': self.color,
            'completado': self.completado
        }

# Crear las tablas
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# Servir manifest.json
@app.route('/static/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')

# Servir service worker
@app.route('/static/sw.js')
def service_worker():
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')

# Obtener todos los eventos
@app.route('/api/eventos', methods=['GET'])
def obtener_eventos():
    eventos = Evento.query.all()
    return jsonify([evento.to_dict() for evento in eventos])

# Crear nuevo evento
@app.route('/api/eventos', methods=['POST'])
def crear_evento():
    data = request.json
    nuevo_evento = Evento(
        titulo=data['titulo'],
        descripcion=data.get('descripcion', ''),
        fecha_inicio=datetime.fromisoformat(data['fecha_inicio']),
        fecha_fin=datetime.fromisoformat(data['fecha_fin']),
        color=data.get('color', '#3788d8'),
        completado=data.get('completado', False)
    )
    db.session.add(nuevo_evento)
    db.session.commit()
    return jsonify(nuevo_evento.to_dict()), 201

# Actualizar evento
@app.route('/api/eventos/<int:id>', methods=['PUT'])
def actualizar_evento(id):
    evento = Evento.query.get_or_404(id)
    data = request.json
    
    evento.titulo = data.get('titulo', evento.titulo)
    evento.descripcion = data.get('descripcion', evento.descripcion)
    evento.fecha_inicio = datetime.fromisoformat(data['fecha_inicio']) if 'fecha_inicio' in data else evento.fecha_inicio
    evento.fecha_fin = datetime.fromisoformat(data['fecha_fin']) if 'fecha_fin' in data else evento.fecha_fin
    evento.color = data.get('color', evento.color)
    evento.completado = data.get('completado', evento.completado)
    
    db.session.commit()
    return jsonify(evento.to_dict())

# Eliminar evento
@app.route('/api/eventos/<int:id>', methods=['DELETE'])
def eliminar_evento(id):
    evento = Evento.query.get_or_404(id)
    db.session.delete(evento)
    db.session.commit()
    return '', 204

# Copiar eventos a un rango de fechas
@app.route('/api/eventos/copiar', methods=['POST'])
def copiar_eventos():
    data = request.json
    eventos_ids = data['eventos_ids']
    fecha_destino = datetime.fromisoformat(data['fecha_destino'])
    repetir_semanas = data.get('repetir_semanas', 1)
    
    eventos_originales = Evento.query.filter(Evento.id.in_(eventos_ids)).all()
    nuevos_eventos = []
    
    for semana in range(repetir_semanas):
        dias_a_sumar = semana * 7
        for evento in eventos_originales:
            diferencia = evento.fecha_fin - evento.fecha_inicio
            nueva_fecha_inicio = fecha_destino + timedelta(days=dias_a_sumar)
            nueva_fecha_fin = nueva_fecha_inicio + diferencia
            
            nuevo_evento = Evento(
                titulo=evento.titulo,
                descripcion=evento.descripcion,
                fecha_inicio=nueva_fecha_inicio,
                fecha_fin=nueva_fecha_fin,
                color=evento.color,
                completado=False
            )
            db.session.add(nuevo_evento)
            nuevos_eventos.append(nuevo_evento)
    
    db.session.commit()
    return jsonify([e.to_dict() for e in nuevos_eventos]), 201

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)