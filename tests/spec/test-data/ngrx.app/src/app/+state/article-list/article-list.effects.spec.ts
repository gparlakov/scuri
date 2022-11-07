import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, StoreModule } from '@ngrx/store';

import { ArticleListEffects } from './article-list.effects';
import { hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';
import { ActionsService } from '../../services/actions.service';
import { ArticlesService } from '../../services/articles.service';
import { ArticlesFacade } from '../articles.facade';
import { MockProvider } from 'ng-mocks';

describe('ArticleListEffects', () => {
  let actions$: Observable<Action>;
  let effects: ArticleListEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({}), HttpClientTestingModule],
      providers: [
        ArticleListEffects,
        provideMockActions(() => actions$),
        MockProvider(ActionsService),
        MockProvider(ArticlesService),
        ArticlesFacade,
      ],
    });

    effects = TestBed.inject(ArticleListEffects);
  });

  describe('someEffect', () => {
    it('should work', async () => {
      actions$ = hot('-a-|', { a: { type: 'LOAD_DATA' } });
      expect(true).toBeTruthy();
    });
  });
});
