import { AppPage } from './app.po';

describe('djjb-news-reader App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display title', () => {
    page.navigateTo();
    expect(page.title()).toEqual('DJJB News');
  });
});
