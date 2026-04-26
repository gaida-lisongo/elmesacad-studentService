import mongoose, { Schema, Document } from 'mongoose';

export interface ISection {
  title: string;
  contenu: string[];
}

export interface IResource extends Document {
  categorie: string;
  designation: string;
  description: ISection[];
  amount: number;
  currency: string;
  status: string;
}

const SectionSchema = new Schema({
  title: { type: String, required: true },
  contenu: [{ type: String }],
}, { _id: false });

const ResourceSchema = new Schema({
  categorie: { type: String, required: true },
  designation: { type: String, required: true },
  description: [SectionSchema],
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, default: 'active' },
}, {
  timestamps: true,
  discriminatorKey: 'categorie',
});

const ResourceModel = mongoose.model<IResource>('Resource', ResourceSchema);

// Discriminants
const LaboSchema = new Schema({
  matiere: { reference: String, designation: String, credit: String },
  titulaire: { reference: String, email: String, matricule: String, nom: String },
  note: Number,
});

const StageSchema = new Schema({
  matiere: { reference: String, designation: String, credit: String },
  titulaire: { reference: String, email: String, matricule: String, nom: String },
  note: Number,
});

const SujetSchema = new Schema({
  matiere: { reference: String, credit: String },
  lecteurs: [{ reference: String, email: String, matricule: String, nom: String }],
  note: Number,
});

const SessionSchema = new Schema({
  matieres: [{ reference: String, credit: String, designation: String }],
});

const ResultatSchema = new Schema({
  programme: { classe: String, filiere: String, credits: Number },
  annee: { debut: String, fin: String, slug: String },
});

export const ResourceLabo = ResourceModel.discriminator('labo', LaboSchema);
export const ResourceStage = ResourceModel.discriminator('stage', StageSchema);
export const ResourceSujet = ResourceModel.discriminator('sujet', SujetSchema);
export const ResourceSession = ResourceModel.discriminator('session', SessionSchema);
export const ResourceResultat = ResourceModel.discriminator('validation', ResultatSchema.clone());
export const ResourceReleve = ResourceModel.discriminator('releve', ResultatSchema.clone());

export default ResourceModel;
