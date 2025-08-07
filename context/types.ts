export interface User {
    id: number;
    name: string;
    email: string;
    schrittlaenge?: number; // optional, falls du es brauchst
    [key: string]: any;     // falls noch weitere Felder vom Backend kommen
  }
  