export interface ComponentAttribute {
  name: string;
  description: string;
  type: string;
  required?: boolean;
  default?: string;
  values?: string[];
}

export interface Component {
  tagName: string;
  description: string;
  attributes: ComponentAttribute[];
  link?: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface CSSClass {
  name: string;
  description: string;
  example?: string;
  properties?: string[];
  minVersion?: string;
  maxVersion?: string;
}
