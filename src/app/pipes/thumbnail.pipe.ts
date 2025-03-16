import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extracts the thumbnail from content:encoded node or direct HTML content
 */
@Pipe({
  name: 'thumbnail'
})
export class ThumbnailPipe implements PipeTransform {

  transform(value: any): string | null {
    if (!value) {
      return null;
    }

    // Try to get content from feed entry
    const content = typeof value === 'object' ? value['content:encoded'] : value;
    if (!content) {
      return null;
    }

    // Extract image URL from HTML content
    const pattern = /<img[^>]+src="([^">]+)"/;
    const img = pattern.exec(content);
    return img ? img[1] : null;
  }
}
