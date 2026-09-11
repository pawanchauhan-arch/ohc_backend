import { BadRequestException } from '@nestjs/common';
import { parseCenterId } from './parse-center-id.util';

describe('parseCenterId', () => {
  it('should parse a single numeric center_id', () => {
    const actual = parseCenterId(45);
    expect(actual.centerIds).toEqual([45]);
    expect(actual.isMultiCenter).toBe(false);
    expect(actual.normalizedInput).toBe(45);
  });

  it('should parse a single string center_id', () => {
    const actual = parseCenterId('45');
    expect(actual.centerIds).toEqual([45]);
    expect(actual.isMultiCenter).toBe(false);
    expect(actual.normalizedInput).toBe(45);
  });

  it('should parse comma-separated center_id values', () => {
    const actual = parseCenterId('45,46,47,50');
    expect(actual.centerIds).toEqual([45, 46, 47, 50]);
    expect(actual.isMultiCenter).toBe(true);
    expect(actual.normalizedInput).toBe('45,46,47,50');
  });

  it('should trim segments and dedupe ids', () => {
    const actual = parseCenterId('45, 46,45,47');
    expect(actual.centerIds).toEqual([45, 46, 47]);
    expect(actual.normalizedInput).toBe('45,46,47');
  });

  it('should ignore non-numeric segments', () => {
    const actual = parseCenterId('45,abc,46');
    expect(actual.centerIds).toEqual([45, 46]);
  });

  it('should throw when required center_id is missing', () => {
    expect(() => parseCenterId(undefined, { required: true })).toThrow(
      BadRequestException,
    );
    expect(() => parseCenterId('', { required: true })).toThrow(
      BadRequestException,
    );
  });

  it('should throw when all segments are invalid', () => {
    expect(() => parseCenterId('abc,xyz')).toThrow(BadRequestException);
  });

  it('should return empty result when center_id is omitted and not required', () => {
    const actual = parseCenterId(undefined);
    expect(actual.centerIds).toEqual([]);
    expect(actual.isMultiCenter).toBe(false);
  });
});
