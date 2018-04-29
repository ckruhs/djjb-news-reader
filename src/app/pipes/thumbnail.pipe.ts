import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extracts the thumbnail from content:encoded node
 *
 * @export
 * @class ThumbnailPipe
 * @implements {PipeTransform}
 */
@Pipe({
  name: 'thumbnail'
})
export class ThumbnailPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    const content = value['content:encoded'];
    // credits: https://stackoverflow.com/questions/34153908/get-img-from-rss-namespaced-element-like-contentencoded
    const pattern = /<img[^>]+src="([^">]+)"/;
    const img = pattern.exec(content);
    return img[1];
  }

}
