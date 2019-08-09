import * as React from 'react';

type Props = {
  name: string[];
};

type State = {
  node: string[];
  values: number[];
};

class CardNode extends React.Component<Props, State> {
}

export default CardNode;