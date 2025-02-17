import * as NumberWord from 'large-number-names'

export function formatNumber(num: number): string {
    if (!num) return '0';
    
    // For numbers less than 1000, just return the number
    if (num < 1000) {
        return Math.floor(num).toString();
    }

    // Use large-number-names for larger numbers
    return NumberWord.humanReadable(num, NumberWord.SHORT)
}
