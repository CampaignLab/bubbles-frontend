export interface Boundary {
    id: string;
    name: string;
    description: string;
}

export const boundaries: Boundary[] = [
    {
        id: "london",
        name: "Greater London",
        description: "Area of the Greater London Authority."
    },
    {
        id: "north-west",
        name: "North West England",
        description: "One of the nine official regions of England."
    }
];
