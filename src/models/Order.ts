import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  parcoursId: mongoose.Types.ObjectId;
  ressourceId: mongoose.Types.ObjectId;
  orderNumber: string;
  telephone: string;
  reference: string;
  payment: 'success' | 'pending' | 'failed';
  delivered: boolean;
  type: 'labo' | 'stage' | 'sujet' | 'session' | 'resultat';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema({
  parcoursId: { type: Schema.Types.ObjectId, ref: 'Parcours', required: true },
  ressourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  orderNumber: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  reference: { type: String, required: true, unique: true },
  payment: { type: String, enum: ['success', 'pending', 'failed'], default: 'pending' },
  delivered: { type: Boolean, default: false },
  type: { type: String, required: true },
}, {
  timestamps: true,
  discriminatorKey: 'type',
});

const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

// Extensions
const OrderLaboSchema = new Schema({
  cote: { type: Number, min: 0, max: 20 },
  observation: String,
});

const OrderStageSchema = new Schema({
  stageTitle: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientQuality: { type: String, required: true },
  recipientSex: { type: String, enum: ['M', 'F'], required: true },
  companyName: { type: String, required: true },
  companyLocation: { type: String, required: true },
  documentReference: String,
});

const SectionSchema = new Schema({
  title: String,
  contenu: [String],
}, { _id: false });

const OrderSujetSchema = new Schema({
  titre: { type: String, required: true },
  directeur: { type: String, required: true },
  co_directeur: { type: String, required: true },
  thematique: { type: String, required: true },
  justification: [String],
  problematique: [String],
  objectif: [String],
  methodologie: [SectionSchema],
  resultats_attendus: [SectionSchema],
  chronogrammes: [SectionSchema],
  references: [SectionSchema],
  note: { type: Number, default: null },
  validation: { type: Boolean, default: null },
  observations: { type: Schema.Types.Mixed, default: null },
});

const OrderSessionSchema = new Schema({
  bulletin: { type: Boolean, default: false },
  recoursIds: [String],
});

// Utilisation de try-catch pour l'enregistrement des discriminants (plus robuste en dev/HMR)
function getOrderDiscriminator(name: string, schema: Schema, value: string) {
  if (OrderModel.discriminators && OrderModel.discriminators[name]) {
    return OrderModel.discriminators[name];
  }
  try {
    return OrderModel.discriminator(name, schema, value);
  } catch (e) {
    return OrderModel.discriminators![name];
  }
}

export const OrderLabo = getOrderDiscriminator('OrderLabo', OrderLaboSchema, 'labo');
export const OrderStage = getOrderDiscriminator('OrderStage', OrderStageSchema, 'stage');
export const OrderSujet = getOrderDiscriminator('OrderSujet', OrderSujetSchema, 'sujet');
export const OrderSession = getOrderDiscriminator('OrderSession', OrderSessionSchema, 'session');
export const OrderResultat = getOrderDiscriminator('OrderResultat', new Schema({}, { _id: false }), 'resultat');

export default OrderModel;
