import { ThumbnailPipe } from './thumbnail.pipe';

describe('ThumbnailPipe', () => {
  let pipe: ThumbnailPipe;

  beforeEach(() => {
    pipe = new ThumbnailPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should extract image URL from HTML content', () => {
    const htmlContent = '<p>Some text</p><img src="https://example.com/image.jpg" /><p>More text</p>';
    expect(pipe.transform(htmlContent)).toBe('https://example.com/image.jpg');
  });

  it('should return first image if multiple images exist', () => {
    const htmlContent = '<img src="https://example.com/first.jpg" /><img src="https://example.com/second.jpg" />';
    expect(pipe.transform(htmlContent)).toBe('https://example.com/first.jpg');
  });

  it('should return null if no image found', () => {
    const htmlContent = '<p>No image here</p>';
    expect(pipe.transform(htmlContent)).toBeNull();
  });

  it('should handle empty input', () => {
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should handle malformed HTML', () => {
    const malformedHtml = '<img src="broken"<p>Bad HTML';
    expect(pipe.transform(malformedHtml)).toBe('broken');
  });
});
