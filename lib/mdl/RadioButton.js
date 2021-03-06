//
// MDL-style Radio button component.
//
// - @see [MDL Radio Button](http://www.getmdl.io/components/index.html#toggles-section/radio)
// - [Props](#props)
// - [Defaults](#defaults)
// - [Built-in builders](#builders)
//
// Created by ywu on 15/10/12.
//
const React = require('react-native');

const {
  Component,
  TouchableWithoutFeedback,
  View,
  Animated,
  PropTypes,
} = React;

const MKColor = require('../MKColor');
const Ripple = require('./Ripple');
const utils = require('../utils');
const {getTheme} = require('../theme');

const DEFAULT_EXTRA_RIPPLE_RADII = 16;

//
// ## <section id='RadioButton'>RadioButton</section>
// The `RadioButton` component.
class RadioButton extends Component {
  constructor(props) {
    super(props);
    this._animatedSize = new Animated.Value(0);
    this._animatedRadius = new Animated.Value(0);
    this._group = null;
    this.state = {
      checked: false,
      width: 0,
      height: 0,
    };
  }

  componentWillMount() {
    this.group = this.props.group;
    this._initView(this.props.checked);
  }

  componentWillReceiveProps(nextProps) {
    this.group = nextProps.group;
    if (nextProps.checked !== this.props.checked) {
      this._initView(nextProps.checked);
    }
  }

  _initView(checked) {
    this.setState({checked});
    this._aniChecked(checked)
  }

  _onLayout({nativeEvent: {layout: {width, height}}}) {
    if (width === this.state.width && height === this.state.height) {
      return;
    }

    const padding = this.props.extraRippleRadius || DEFAULT_EXTRA_RIPPLE_RADII;
    this.setState({
      width: width + padding,
      height: height + padding,
    });
  }

  // Touch events handling
  _onTouch(evt) {
    switch (evt.type) {
      case 'TOUCH_UP':
        if (!this.state.checked) {
          this.confirmToggle();
        }
        break;
    }
  }

  // When a toggle action (from the given state) is confirmed.
  confirmToggle() {
    const prevState = this.state.checked;
    const newState = !prevState;

    this.setState({checked: newState}, () => {
      if (this.props.onCheckedChange) {
        this.props.onCheckedChange({checked: this.state.checked});
      }
    });

    // update state of the other buttons in the group
    if (this.group) {
      this.group.onChecked(this, newState);
    }

    this._aniChecked.call(this, newState);
  }

  confirmUncheck() {
    this.setState({checked: false}, () => {
      if (this.props.onCheckedChange) {
        this.props.onCheckedChange({checked: this.state.checked});
      }
    });

    this._aniChecked.call(this, false);
  }

  // animate the checked state, by scaling the inner circle
  _aniChecked(checked) {
    Animated.parallel([
      Animated.timing(this._animatedRadius, {
        toValue: checked ? 5 : 0,
        duration: 200,
      }),
      Animated.timing(this._animatedSize, {
        toValue: checked ? 10 : 0,
        duration: 200,
      }),
    ]).start();
  }

  render() {
    const defaultStyle = getTheme().radioStyle;
    const mergedStyle = Object.assign({}, defaultStyle, utils.compact({
      borderOnColor: this.props.borderOnColor,
      borderOffColor: this.props.borderOffColor,
      fillColor: this.props.fillColor,
      rippleColor: this.props.rippleColor,
    }));
    const borderColor = this.state.checked ? mergedStyle.borderOnColor : mergedStyle.borderOffColor;

    return (
      <TouchableWithoutFeedback {...utils.extractTouchableProps(this)} >
        <Ripple
          {...this.props}
          maskBorderRadiusInPercent={50}
          rippleLocation="center"
          rippleColor={mergedStyle.rippleColor}
          onTouch={this._onTouch.bind(this)}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: this.state.width,
            height: this.state.height,
          }}
          >
          <View ref="outerCircle"
                style={[
                  RadioButton.defaultProps.style,
                  {borderColor},
                  this.props.style,
                ]}
                onLayout={this._onLayout.bind(this)}
            >
            <Animated.View
              ref="innerCircle"
              style={{
                backgroundColor: mergedStyle.fillColor,
                width: this._animatedSize,
                height: this._animatedSize,
                borderRadius: this._animatedRadius,
              }}
            />
          </View>
        </Ripple>
      </TouchableWithoutFeedback>
    );
  }
}

Object.defineProperty(RadioButton.prototype, 'group', {
  // Set the group of this radio
  set: function (group) {
    this._group = group;
    if (group) {
      group.add(this);
    }
  },
  // Retrieve the group of this radio
  get: function () {
    return this._group;
  },
  enumerable: true,
});

// ## <section id='props'>Props</section>
RadioButton.propTypes = {
  // [Ripple Props](Ripple.html#props)...
  ...Ripple.propTypes,

  // Touchable...
  ...TouchableWithoutFeedback.propTypes,

  // Color of the border (outer circle), when checked
  borderOnColor: PropTypes.string,

  // Color of the border (outer circle), when unchecked
  borderOffColor: PropTypes.string,

  // Color of the inner circle, when checked
  fillColor: PropTypes.string,

  // Toggle status
  checked: PropTypes.bool,

  // Group to which the Radio button belongs
  group: PropTypes.object,

  // Callback when the toggle status is changed
  onCheckedChange: PropTypes.func,

  // How far the ripple can extend outside the RadioButton's border,
  // default is 16
  extraRippleRadius: PropTypes.number,
};

// ## <section id='defaults'>Defaults</section>
RadioButton.defaultProps = {
  pointerEvents: 'box-only',
  maskColor: MKColor.Transparent,
  style: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
  },
};


//
// ## <section id='Group'>Group</section>
// Managing a group of radio buttons.
class Group {
  constructor() {
    this.buttons = [];
  }

  add(btn) {
    if (this.buttons.indexOf(btn) < 0) {
      this.buttons.push(btn);
    }
  }

  onChecked(btn, checked) {
    if (checked) {
      this.buttons.forEach((it) => it !== btn && it.confirmUncheck());
    }
  }
}


// --------------------------
// Builder
//
const {
  Builder,
} = require('../builder');

//
// ## RadioButton builder
//
class RadioButtonBuilder extends Builder {
  build() {
    const BuiltRadioButton = class extends RadioButton {};
    BuiltRadioButton.defaultProps = Object.assign({}, RadioButton.defaultProps, this.toProps());
    return BuiltRadioButton;
  }
}

// define builder method for each prop
RadioButtonBuilder.defineProps(RadioButton.propTypes);

// ----------
// ## <section id="builders">Built-in builders</section>
//
function builder() {
  return new RadioButtonBuilder().withBackgroundColor(MKColor.Transparent);
}


// ## Public interface
module.exports = RadioButton;
RadioButton.Group = Group;
RadioButton.builder = builder;
RadioButton.Builder = RadioButtonBuilder;
