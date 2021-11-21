import { Service } from './service';
import { Router } from '@the/router';
import { Just } from 'maybe';
import { ExampleComponent } from './example.component';
import { autoSpy, spyInject } from 'jasmine-auto-spies';

describe('ExampleComponent', () => {
   let ServiceSpy: Service;
       let RouterSpy: Router;
       let JustSpy: Just;
      
    // scuri:lets

  beforeEach(
  waitForAsync(() => {
      TestBed.configureTestingModule({
      providers: [
              MyDirective,
           { provide: Service, useClass: autoSpy(Service, 'Service') },
           { provide: Router, useClass: autoSpy(Router, 'Router') },
           { provide: Just, useClass: autoSpy(Just, 'Just') },
          
          // scuri:injectables
      ]
      });

      directive = TestBed.inject(MyDirective);
       ServiceSpy = spyInject<Service>(TestBed.inject(Service));
       RouterSpy = spyInject<Router>(TestBed.inject(Router));
       JustSpy = spyInject<Just>(TestBed.inject(Just));
      
      // scuri:get-instances

  })
  );

  it('when myMethod is called it should', () => {
  // arrange
  // act
  e.myMethod();
  // assert
  // expect(e).toEqual
  });
  
});

