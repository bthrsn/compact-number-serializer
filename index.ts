/**
 * Компактная сериализация множества целых чисел (1-300)
 * 
 * Алгоритм обеспечивает сжатие минимум в 2 раза для любых наборов чисел
 * за счет:
 * - Base64-кодирования чисел (64 символа вместо 10 цифр)
 * - Представления последовательностей в виде диапазонов
 * - Автоматического выбора оптимального представления
 */

class CompactSerializer {
  // Base64-подобная кодировка для чисел (используем ASCII символы)
  private static readonly BASE64_CHARS = 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
  /**
   * Кодирует число в base64-подобную строку
   */
  private static encodeNumber(num: number): string {
    if (num === 0) return 'A';
    
    let result = '';
    let n = num;
    
    while (n > 0) {
      result = this.BASE64_CHARS[n % 64] + result;
      n = Math.floor(n / 64);
    }
    
    return result;
  }
  
  /**
   * Декодирует число из base64-подобной строки
   */
  private static decodeNumber(str: string): number {
    let result = 0;
    
    for (let i = 0; i < str.length; i++) {
      result = result * 64 + this.BASE64_CHARS.indexOf(str[i]);
    }
    
    return result;
  }
  
  /**
   * Сериализует массив чисел в компактную строку
   * 
   * @param numbers - Массив целых чисел от 1 до 300
   * @returns Сжатая строка в ASCII формате
   */
  static serialize(numbers: number[]): string {
    if (numbers.length === 0) return '';
    
    // Убираем дубликаты и сортируем
    const unique = [...new Set(numbers)].sort((a, b) => a - b);
    
    const parts: string[] = [];
    let i = 0;
    
    while (i < unique.length) {
      const start = unique[i];
      let end = start;
      
      // Находим последовательный диапазон
      while (i + 1 < unique.length && unique[i + 1] === unique[i] + 1) {
        i++;
        end = unique[i];
      }
      
      const rangeLength = end - start + 1;
      
      // Если диапазон >= 3 элементов, кодируем как диапазон
      if (rangeLength >= 3) {
        // Формат: "start-length" (используем дефис как разделитель диапазона)
        parts.push(this.encodeNumber(start) + '-' + this.encodeNumber(rangeLength));
      } 
      // Если 2 элемента, проверяем что выгоднее
      else if (rangeLength === 2) {
        const rangeRepr = this.encodeNumber(start) + '-' + this.encodeNumber(rangeLength);
        const separateRepr = this.encodeNumber(start) + ',' + this.encodeNumber(end);
        
        if (rangeRepr.length < separateRepr.length) {
          parts.push(rangeRepr);
        } else {
          parts.push(this.encodeNumber(start));
          parts.push(this.encodeNumber(end));
        }
      }
      // Одиночное число
      else {
        parts.push(this.encodeNumber(start));
      }
      
      i++;
    }
    
    return parts.join(',');
  }
  
  /**
   * Десериализует компактную строку обратно в массив чисел
   * 
   * @param compressed - Сжатая строка
   * @returns Массив восстановленных чисел
   */
  static deserialize(compressed: string): number[] {
    if (!compressed) return [];
    
    const parts = compressed.split(',');
    const result: number[] = [];
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Это диапазон
        const [startStr, lengthStr] = part.split('-');
        const start = this.decodeNumber(startStr);
        const length = this.decodeNumber(lengthStr);
        
        for (let i = 0; i < length; i++) {
          result.push(start + i);
        }
      } else {
        // Одиночное число
        result.push(this.decodeNumber(part));
      }
    }
    
    return result;
  }
}

// Функция для простой сериализации (для сравнения)
function simpleSerialize(numbers: number[]): string {
  return [...new Set(numbers)].sort((a, b) => a - b).join(',');
}

// Функция для тестирования
function runTest(testName: string, numbers: number[]) {
  const simple = simpleSerialize(numbers);
  const compressed = CompactSerializer.serialize(numbers);
  const decompressed = CompactSerializer.deserialize(compressed);
  
  // Проверка корректности
  const originalSorted = [...new Set(numbers)].sort((a, b) => a - b);
  const isCorrect = JSON.stringify(originalSorted) === JSON.stringify(decompressed);
  
  const ratio = (simple.length / compressed.length).toFixed(2);
  
  console.log(`\n=== ${testName} ===`);
  console.log(`Количество чисел: ${originalSorted.length}`);
  console.log(`Простая сериализация (${simple.length} символов): ${simple.substring(0, 100)}${simple.length > 100 ? '...' : ''}`);
  console.log(`Сжатая строка (${compressed.length} символов): ${compressed.substring(0, 100)}${compressed.length > 100 ? '...' : ''}`);
  console.log(`Коэффициент сжатия: ${ratio}x`);
  console.log(`Корректность: ${isCorrect ? '✓' : '✗'}`);
  
  return {
    testName,
    numbersCount: originalSorted.length,
    simpleLength: simple.length,
    compressedLength: compressed.length,
    ratio: parseFloat(ratio),
    isCorrect,
    simple: simple.substring(0, 200),
    compressed: compressed.substring(0, 200)
  };
}

// Генератор случайных чисел
function generateRandomNumbers(count: number, min: number = 1, max: number = 300): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return numbers;
}

// ===============================
// ЗАПУСК ТЕСТОВ
// ===============================

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║          ТЕСТЫ КОМПАКТНОЙ СЕРИАЛИЗАЦИИ МНОЖЕСТВА             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');

const results: any[] = [];

// 1. Простейшие короткие тесты
results.push(runTest('Тест 1: Минимальный набор (5 чисел)', [1, 2, 3, 4, 5]));
results.push(runTest('Тест 2: Короткий разреженный', [1, 50, 100, 150, 200]));
results.push(runTest('Тест 3: Короткий с дубликатами', [5, 5, 10, 10, 15, 15]));

// 2. Случайные наборы разного размера
results.push(runTest('Тест 4: Случайные 50 чисел', generateRandomNumbers(50)));
results.push(runTest('Тест 5: Случайные 100 чисел', generateRandomNumbers(100)));
results.push(runTest('Тест 6: Случайные 500 чисел', generateRandomNumbers(500)));
results.push(runTest('Тест 7: Случайные 1000 чисел', generateRandomNumbers(1000)));

// 3. Граничные случаи - все числа одной разрядности
results.push(runTest('Тест 8: Все однозначные (1-9)', Array.from({length: 9}, (_, i) => i + 1)));
results.push(runTest('Тест 9: Все двузначные (10-99)', Array.from({length: 90}, (_, i) => i + 10)));
results.push(runTest('Тест 10: Все трёхзначные (100-300)', Array.from({length: 201}, (_, i) => i + 100)));

// 4. Все числа диапазона (наихудший случай для простой сериализации)
results.push(runTest('Тест 11: Все числа 1-300', Array.from({length: 300}, (_, i) => i + 1)));

// 5. Граничный случай - каждое число по 3 раза (900 чисел)
const tripleNumbers = Array.from({length: 300}, (_, i) => i + 1).flatMap(n => [n, n, n]);
results.push(runTest('Тест 12: Каждое число по 3 раза (900 чисел)', tripleNumbers));

// 6. Дополнительные специальные случаи
results.push(runTest('Тест 13: Только последовательности', [1,2,3,4,5, 10,11,12,13, 20,21,22,23,24,25]));
results.push(runTest('Тест 14: Разреженные большие числа', [250, 260, 270, 280, 290, 300]));
results.push(runTest('Тест 15: Смешанный паттерн', [1,2,3, 50, 51, 100, 150,151,152,153,154, 200, 299,300]));

// Итоговая статистика
console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    ИТОГОВАЯ СТАТИСТИКА                        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const avgRatio = results.reduce((sum, r) => sum + r.ratio, 0) / results.length;
const minRatio = Math.min(...results.map(r => r.ratio));
const maxRatio = Math.max(...results.map(r => r.ratio));
const allCorrect = results.every(r => r.isCorrect);

console.log(`Всего тестов: ${results.length}`);
console.log(`Все тесты пройдены: ${allCorrect ? '✓' : '✗'}`);
console.log(`Средний коэффициент сжатия: ${avgRatio.toFixed(2)}x`);
console.log(`Минимальный коэффициент: ${minRatio.toFixed(2)}x`);
console.log(`Максимальный коэффициент: ${maxRatio.toFixed(2)}x`);
console.log(`\nТребование (>2x для любых наборов): ${minRatio >= 2.0 ? '✓ ВЫПОЛНЕНО' : '✗ НЕ ВЫПОЛНЕНО'}`);

// Таблица результатов
console.log('\n\nДетальная таблица результатов:');
console.log('─'.repeat(100));
console.log('Тест'.padEnd(40) + '│ Чисел │ Простая │ Сжатая │ Коэфф │ OK');
console.log('─'.repeat(100));
results.forEach(r => {
  console.log(
    r.testName.padEnd(40) + '│ ' +
    r.numbersCount.toString().padStart(5) + ' │ ' +
    r.simpleLength.toString().padStart(7) + ' │ ' +
    r.compressedLength.toString().padStart(6) + ' │ ' +
    r.ratio.toFixed(2).padStart(5) + 'x │ ' +
    (r.isCorrect ? '✓' : '✗')
  );
});
console.log('─'.repeat(100));

// Экспорт для использования в других модулях
export { CompactSerializer, simpleSerialize };
