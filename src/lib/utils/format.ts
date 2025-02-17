import * as NumberWord from 'large-number-names';

export function formatNumber(num: number): string {
    if (!num) return '0';
    const integerPart = Math.floor(num);
    
    // For numbers less than 1000, just return the number
    if (num < 1000) {
        return integerPart.toString();
    }

    // Get the scale (K, M, B, etc.)
    const scale = NumberWord.humanReadable(integerPart, NumberWord.GAME_SCALE);
    if (!scale) return integerPart.toString();

    // Convert to scientific notation and extract the coefficient
    const scientificStr = integerPart.toExponential(2);
    const coefficient = scientificStr.split('e')[0];
    
    // Remove trailing zeros after decimal point
    const cleanCoefficient = coefficient.replace(/\.?0+$/, '');
    
    return `${cleanCoefficient}${scale}`;
}
