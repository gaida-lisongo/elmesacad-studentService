import { IOrder } from '../models/Order';
import DocumentLaboratoire from '../util/pdf/DocumentLaboratoire';
import DocumentMacaron from '../util/pdf/DocumentMacaron';
import DocumentStage from '../util/pdf/DocumentStage';
import DocumentSujet from '../util/pdf/DocumentSujet';
import DocumentBulletin from '../util/pdf/DocumentBulletin';
import DocumentReleve from '../util/pdf/DocumentReleve';
import logger from 'jet-logger';

export class DocumentMappingService {
  /**
   * Mappe une commande vers sa classe de document correspondante et génère le buffer
   */
  static async generateDocumentBuffer(order: any): Promise<Buffer> {
    const type = order.type;
    const student = order.parcoursId.student;
    const parcour = order.parcoursId;
    const ressource = order.ressourceId;
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/commandes/verify/${order._id}`;

    let docInstance: any;

    switch (type) {
      case 'labo':
        docInstance = new DocumentLaboratoire({
          student: { nom: student.nomComplet, sexe: student.sexe, ville: student.lieu_naissance || 'Kinshasa' },
          parcour: { promotion: parcour.programme.classe, systeme: 'LMD', matricule: student.matricule, annee: parcour.annee.slug },
          contact: { email: student.email, telephone: order.telephone, adresse: student.lieu_naissance || '' },
          document: { type: 'Bon de Laboratoire', ressource: ressource.designation, detail: ressource.designation, reference: order.reference, dateCreate: new Date().toLocaleDateString('fr-FR') },
          laboratoire: { designation: ressource.designation, montant: ressource.amount },
          verificationUrl
        });
        await docInstance.generate();
        break;

      case 'session':
        docInstance = new DocumentMacaron({
          student: { nom: student.nomComplet, sexe: student.sexe, ville: student.lieu_naissance || 'Kinshasa', profile: student.photo },
          parcour: { promotion: parcour.programme.classe, systeme: 'LMD', matricule: student.matricule, annee: parcour.annee.slug },
          contact: { email: student.email, telephone: order.telephone, adresse: '' },
          document: { type: 'Macaron de Session', ressource: 'Session Académique', detail: ressource.designation, reference: order.reference, dateCreate: new Date().toLocaleDateString('fr-FR') },
          session: { title: ressource.designation, amount: ressource.amount, period: { start: null, end: null } },
          matieres: order.matieres || [],
          verificationUrl,
          documentApproval: {
            chef: ressource.branding?.chef,
            email: ressource.branding?.email,
            telephone: ressource.branding?.contact,
          },
        });
        await docInstance.generate();
        break;

      case 'stage':
        docInstance = new DocumentStage({
          type: 'stage',
          parcoursId: parcour._id.toString(),
          ressourceId: ressource._id.toString(),
          telephone: order.telephone,
          payment: order.payment,
          delivered: order.delivered,
          validationStatus: order.validationStatus || 'pending',
          stageTitle: order.stageTitle || ressource.designation,
          recipientName: order.recipientName,
          recipientQuality: order.recipientQuality,
          recipientSex: order.recipientSex,
          companyName: order.companyName,
          companyLocation: order.companyLocation,
          student: { fullName: student.nomComplet, matricule: student.matricule, email: student.email }
        });
        await docInstance.generate(verificationUrl, { 
            nom: ressource.branding?.chef || process.env.NEXT_PUBLIC_CHEF || '', 
            titre: 'Chef de Section' 
        });
        break;

      case 'sujet':
        docInstance = new DocumentSujet({
          projet: {
            validation: order.validation,
            note: order.note,
            titre: order.titre,
            directeur: order.directeur,
            co_directeur: order.co_directeur,
            thematique: [order.thematique],
            justification: order.justification,
            problematique: order.problematique,
            objectif: order.objectif,
            methodology: order.methodologie?.map((m: any) => ({ section: m.title, content: m.contenu.join('\n') })),
            resultats: order.resultats_attendus?.map((r: any) => ({ section: r.title, content: r.contenu.join('\n') })),
            chronogrammes: order.chronogrammes?.map((c: any) => ({ section: c.title, content: c.contenu.join('\n') })),
            references: order.references?.map((ref: any) => ({ section: ref.title, content: ref.contenu.join('\n') })),
          },
          student: {
            nom: student.nomComplet,
            email: student.email,
            telephone: order.telephone,
            matricule: student.matricule,
            programme: parcour.programme.classe,
            annee: parcour.annee.slug
          }
        });
        // On génère le protocole par défaut
        await docInstance.generate(verificationUrl, 'Protocle');
        break;

      default:
        throw new Error(`Type de document non supporté : ${type}`);
    }

    return await docInstance.generateBuffer();
  }
}
