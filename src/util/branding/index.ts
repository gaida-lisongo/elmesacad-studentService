
export const getSchoolName = () => process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || "INSTITUT SUPERIEUR";
export const getInstitutSigle = () => process.env.NEXT_PUBLIC_INSTITUT?.trim() || "INBTP";
export const getContact = () => process.env.NEXT_PUBLIC_CONTACT?.trim() || "Non renseigne";
export const getEmail = () => process.env.NEXT_PUBLIC_EMAIL?.trim() || "Non renseigne";
export const getAddress = () => process.env.NEXT_PUBLIC_ADRESS?.trim() || "Non renseigne";
export const getChef = () => process.env.NEXT_PUBLIC_CHEF || 'Non renseigne';
