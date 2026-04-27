import mongoose, { Schema, Document } from 'mongoose';

export interface IParcours extends Document {
  student: {
    email: string;
    matricule: string;
    sexe: 'M' | 'F';
    photo?: string;
    nomComplet: string;
    nationalite?: string;
    date_naissance?: string;
    lieu_naissance?: string;
  };
  programme: {
    classe: string;
    filiere: string;
    credits: number;
  };
  annee: {
    debut: string;
    fin: string;
    slug: string;
  };
  status: 'inscrit' | 'suspendu' | 'abandon' | 'diplômé';
  ncv?: number;
  reference: string;
}

const ParcoursSchema: Schema = new Schema({
  student: {
    email: { type: String, required: true },
    matricule: { type: String, required: true },
    sexe: { type: String, enum: ['M', 'F'], required: true },
    photo: { type: String },
    nomComplet: { type: String, required: true },
    nationalite: { type: String },
    date_naissance: { type: String },
    lieu_naissance: { type: String },
  },
  programme: {
    classe: { type: String, required: true },
    filiere: { type: String, required: true },
    credits: { type: Number, required: true },
  },
  annee: {
    debut: { type: String, required: true },
    fin: { type: String, required: true },
    slug: { type: String, required: true },
  },
  status: { 
    type: String, 
    enum: ['inscrit', 'suspendu', 'abandon', 'diplômé'], 
    default: 'inscrit',
    required: true 
  },
  ncv: { type: Number },
  reference: { type: String, required: true, unique: true },
}, {
  timestamps: true,
});

// Index pour la recherche
ParcoursSchema.index({ 'student.nomComplet': 'text' });
ParcoursSchema.index({ 'student.matricule': 1 });
ParcoursSchema.index({ 'student.email': 1 });
ParcoursSchema.index({ 'programme.filiere': 1 });
ParcoursSchema.index({ 'annee.slug': 1 });

export default mongoose.model<IParcours>('Parcours', ParcoursSchema);
