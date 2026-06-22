import React from "react";
import { render } from '@testing-library/react-native';
import { LeafletOSMMap } from "./LeafletOSMMap";
import WebView from "react-native-webview";

jest.mock('react-native-webview', () => {
    const { View } = require('react-native');
    return {
        WebView: (props: any) => <View {...props} />,
    };
});

test('renders Webview', () => {
    const { getByTestId } = render(
        <LeafletOSMMap start="Berlin" end="Munich" />
    );

    expect(getByTestId('map-webview')).toBeTruthy();
});

test('injects start and end into HTML', () => {
    const { getByTestId } = render(
        <LeafletOSMMap start="Berlin" end="Munich" />
    );

    const webview = getByTestId('map-webview');

    const html = webview.props.source.html;

    expect(html).toContain('Berlin');
    expect(html).toContain('Munich');
});

test('encodes start and end properly', () => {
    const { getByTestId } = render(
        <LeafletOSMMap start="New York" end="Los Angeles" />
    );

    const html = getByTestId('map-webview').props.source.html;

    expect(html).toContain('New%20York');
    expect(html).toContain('Los%20Angeles');
});