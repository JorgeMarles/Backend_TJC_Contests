const sumMinutes = (date: Date, minutes: number): Date => {
    const result = new Date(date); // Crear una copia del objeto Date
    result.setMinutes(result.getMinutes() + minutes); // Sumar los minutos
    return result;
};