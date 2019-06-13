import { autoSpy } from 'autoSpy';
import { <%= className %> } from './<%= normalizedName %>';

describe('<%= className %>', () => {
  it('when then should', () => {
    // arrange
    const { build } = setup().default();
    const c = build();
    // act
    // c.act
    // assert
    // expect(c).toEqual
  });
});

function setup() {
  <%= toDeclaration() %>
  const builder = {
    <%= toBuilderExports() %>
    default() {
      return builder;
    },
    build() {
      return new <%= className %>(<%= toConstructorParams() %>);
    }
  };

  return builder;
}
