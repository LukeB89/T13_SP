import React from 'react';
import WeatherIcon from '../src';
import { expect } from 'chai';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('WeatherIcon', () => {

  describe('open weather map component', () => {
    let wrapper;
    it('should have name owm', () => {
      wrapper = shallow(<WeatherIcon name='owm' iconId="200" />);
      expect(wrapper.props().name).to.equal('owm');
    });
    it('should map appropriate className with ID 200 for owm', () => {

      wrapper = shallow(<WeatherIcon name='owm' iconId="200" />);
      expect(wrapper.props().className).to.equal('wi wi-day-storm-showers');
    });
  });

  describe('yahoo component', () => {
    let wrapper;
    it('should have name yahoo', () => {
      wrapper = shallow(<WeatherIcon name='yahoo' iconId='0' />);
      expect(wrapper.props().name).to.equal('yahoo');
    });
    it('should map appropriate className with ID 0 for yahoo', () => {

      wrapper = shallow(<WeatherIcon name='yahoo' iconId='0' />);
      expect(wrapper.props().className).to.equal('wi wi-yahoo-0');
    });
  });

  describe('darksky component', () => {
    let wrapper;
    it('should have name darksky', () => {
      wrapper = shallow(<WeatherIcon name='darksky' iconId='clear-day' />);
      expect(wrapper.props().name).to.equal('darksky');
    });
    it('should map appropriate className with ID clear-day for darksky', () => {
      wrapper = shallow(<WeatherIcon name='darksky' iconId='clear-day' />);
      expect(wrapper.props().className).to.equal('wi wi-forecast-io-clear-day');
    });
  });
});
