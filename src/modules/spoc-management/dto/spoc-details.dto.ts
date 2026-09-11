export class SpocDetailsDto {
  cetSpoc: {
    name: string;
    email: string;
    whatsapp: string;
    alternateName?: string;
    alternateEmail?: string;
    alternateWhatsapp?: string;
  };
  clientSpoc: {
    name: string;
    email: string;
    whatsapp: string;
    clientName: string;
    clientAddress: string;
    clientContact: string;
  };
}

export class CetSpocDto {
  name: string;
  email: string;
  whatsapp: string;
  alternateName?: string;
  alternateEmail?: string;
  alternateWhatsapp?: string;
}

export class ClientSpocDto {
  name: string;
  email: string;
  whatsapp: string;
  clientName: string;
  clientAddress: string;
  clientContact: string;
}
