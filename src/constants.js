export const DRINKS = [
  { id: 'recover', name: 'RECOVER', price: 6000 },
  { id: 'gatorade', name: 'GATORADE', price: 5000 },
  { id: 'agua_600', name: 'AGUA 600ml', price: 3000 },
  { id: 'agua_1l', name: 'AGUA 1L', price: 4000 },
  { id: 'redbull', name: 'REDBULL', price: 9500 },
  { id: 'speed_pq', name: 'SPEED pq', price: 3000 },
  { id: 'speed_gr', name: 'SPEED gr', price: 4000 },
]

export const ALMACEN = [
  { id: 'bucal', name: 'Bucal', price: 30000 },
  { id: 'vendas', name: 'Vendas', price: 90000 },
  { id: 'camisas', name: 'Camisas', price: 50000 },
  { id: 'canilleras', name: 'Canilleras', price: 130000 },
]

export const CATEGORIES = [
  { value: 'bebida', label: 'Bebida' },
  { value: 'almacen', label: 'Almacén / Insumos' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'clase_cortesia', label: 'Clase de Cortesía' },
]

export const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
]

export const CLASSES = [
  { value: 'muay_thai', label: 'Muay Thai' },
  { value: 'boxeo', label: 'Boxeo' },
  { value: 'karate', label: 'Karate' },
  { value: 'jiu_jitsu', label: 'Jiu-jitsu' },
]

export const MEMBERSHIP_TYPES = [
  { value: 'grupal', label: 'Grupal' },
  { value: 'personalizado', label: 'Personalizado' },
]

export const MEMBERSHIPS = {
  grupal: [
    { id: 'g4', name: '4 clases (1x semana)', price: 100000 },
    { id: 'g8', name: '8 clases (2x semana)', price: 140000 },
    { id: 'g12', name: '12 clases (3x semana)', price: 170000 },
    { id: 'g20', name: '20 clases (5x semana)', price: 200000 },
    { id: 'g1', name: '1 clase', price: 30000 },
  ],
  personalizado: [
    { id: 'p4', name: '4 clases', price: 230000 },
    { id: 'p8', name: '8 clases', price: 450000 },
    { id: 'p12', name: '12 clases', price: 600000 },
    { id: 'p20', name: '20 clases', price: 900000 },
    { id: 'p1', name: '1 clase', price: 60000 },
  ],
}
