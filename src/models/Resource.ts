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

const ResourceModel = mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);

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

// Utilisation de try-catch pour l'enregistrement des discriminants (plus robuste en dev/HMR)
function getResourceDiscriminator(name: string, schema: Schema, value: string) {
  if (ResourceModel.discriminators && ResourceModel.discriminators[name]) {
    return ResourceModel.discriminators[name];
  }
  try {
    return ResourceModel.discriminator(name, schema, value);
  } catch (e) {
    return ResourceModel.discriminators![name];
  }
}

export const ResourceLabo = getResourceDiscriminator('ResourceLabo', LaboSchema, 'labo');
export const ResourceStage = getResourceDiscriminator('ResourceStage', StageSchema, 'stage');
export const ResourceSujet = getResourceDiscriminator('ResourceSujet', SujetSchema, 'sujet');
export const ResourceSession = getResourceDiscriminator('ResourceSession', SessionSchema, 'session');
export const ResourceResultat = getResourceDiscriminator('ResourceValidation', ResultatSchema.clone(), 'validation');
export const ResourceReleve = getResourceDiscriminator('ResourceReleve', ResultatSchema.clone(), 'releve');

export default ResourceModel;
