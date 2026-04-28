export interface AdministrativeDivision {
  code: string;
  name: string;
  municipalities: string[];
}

export const DOMINICAN_PROVINCES: AdministrativeDivision[] = [
  { code: "01", name: "Distrito Nacional", municipalities: ["Santo Domingo de Guzmán"] },
  { code: "02", name: "Azua", municipalities: ["Azua de Compostela", "Estebanía", "Guayabal", "Las Charcas", "Las Yayas de Viajama", "Padre Las Casas", "Peralta", "Pueblo Viejo", "Sabana Yegua", "Tábara Arriba"] },
  { code: "03", name: "Baoruco", municipalities: ["Neiba", "Galván", "Los Ríos", "Tamayo", "Villa Jaragua"] },
  { code: "04", name: "Barahona", municipalities: ["Santa Cruz de Barahona", "Cabral", "El Peñón", "Enriquillo", "Fundación", "Jaquimeyes", "La Ciénaga", "Las Salinas", "Paraíso", "Polo", "Vicente Noble"] },
  { code: "05", name: "Dajabón", municipalities: ["Dajabón", "El Pino", "Loma de Cabrera", "Partido", "Restauración"] },
  { code: "06", name: "Duarte", municipalities: ["San Francisco de Macorís", "Arenoso", "Castillo", "Eugenio María de Hostos", "Las Guáranas", "Pimentel", "Villa Riva"] },
  { code: "07", name: "Elías Piña", municipalities: ["Comendador", "Bánica", "El Llano", "Hondo Valle", "Juan Santiago", "Pedro Santana"] },
  { code: "08", name: "El Seibo", municipalities: ["Santa Cruz del Seibo", "Miches"] },
  { code: "09", name: "Espaillat", municipalities: ["Moca", "Cayetano Germosén", "Gaspar Hernández", "Jamao al Norte"] },
  { code: "10", name: "Hato Mayor", municipalities: ["Hato Mayor del Rey", "El Valle", "Sabana de la Mar"] },
  { code: "11", name: "Hermanas Mirabal", municipalities: ["Salcedo", "Tenares", "Villa Tapia"] },
  { code: "12", name: "Independencia", municipalities: ["Jimaní", "Cristóbal", "Duvergé", "La Descubierta", "Mella", "Postrer Río"] },
  { code: "13", name: "La Altagracia", municipalities: ["Higüey", "San Rafael del Yuma"] },
  { code: "14", name: "La Romana", municipalities: ["La Romana", "Guaymate", "Villa Hermosa"] },
  { code: "15", name: "La Vega", municipalities: ["Concepción de La Vega", "Constanza", "Jarabacoa", "Jima Abajo"] },
  { code: "16", name: "María Trinidad Sánchez", municipalities: ["Nagua", "Cabrera", "El Factor", "Río San Juan"] },
  { code: "17", name: "Monseñor Nouel", municipalities: ["Bonao", "Maimón", "Piedra Blanca"] },
  { code: "18", name: "Monte Cristi", municipalities: ["San Fernando de Monte Cristi", "Castañuelas", "Guayubín", "Las Matas de Santa Cruz", "Pepillo Salcedo", "Villa Vásquez"] },
  { code: "19", name: "Monte Plata", municipalities: ["Monte Plata", "Bayaguana", "Peralvillo", "Sabana Grande de Boyá", "Yamasá"] },
  { code: "20", name: "Pedernales", municipalities: ["Pedernales", "Oviedo"] },
  { code: "21", name: "Peravia", municipalities: ["Baní", "Nizao"] },
  { code: "22", name: "Puerto Plata", municipalities: ["San Felipe de Puerto Plata", "Altamira", "Guananico", "Imbert", "Los Hidalgos", "Luperón", "Sosúa", "Villa Isabela", "Villa Montellano"] },
  { code: "23", name: "Samaná", municipalities: ["Santa Bárbara de Samaná", "Las Terrenas", "Sánchez"] },
  { code: "24", name: "Sánchez Ramírez", municipalities: ["Cotuí", "Cevicos", "Fantino", "La Mata"] },
  { code: "25", name: "San Cristóbal", municipalities: ["San Cristóbal", "Bajos de Haina", "Cambita Garabitos", "Los Cacaos", "Sabana Grande de Palenque", "San Gregorio de Nigua", "Villa Altagracia", "Yaguate"] },
  { code: "26", name: "San José de Ocoa", municipalities: ["San José de Ocoa", "Rancho Arriba", "Sabana Larga"] },
  { code: "27", name: "San Juan", municipalities: ["San Juan de la Maguana", "Bohechío", "El Cercado", "Juan de Herrera", "Las Matas de Farfán", "Vallejuelo"] },
  { code: "28", name: "San Pedro de Macorís", municipalities: ["San Pedro de Macorís", "Consuelo", "Guayacanes", "Quisqueya", "Ramón Santana", "San José de Los Llanos"] },
  { code: "29", name: "Santiago", municipalities: ["Santiago de los Caballeros", "Bisonó", "Jánico", "Licey al Medio", "Puñal", "Sabana Iglesia", "San José de las Matas", "Tamboril", "Villa González"] },
  { code: "30", name: "Santiago Rodríguez", municipalities: ["San Ignacio de Sabaneta", "Los Almácigos", "Monción"] },
  { code: "31", name: "Valverde", municipalities: ["Mao", "Esperanza", "Laguna Salada"] },
  { code: "32", name: "Santo Domingo", municipalities: ["Santo Domingo Este", "Boca Chica", "Los Alcarrizos", "Pedro Brand", "San Antonio de Guerra", "Santo Domingo Norte", "Santo Domingo Oeste"] },
];
