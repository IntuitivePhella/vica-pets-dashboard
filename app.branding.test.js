const test = require('node:test');
const assert = require('node:assert/strict');

const {
    getSaoPauloDateContext,
    normalizeHttpUrl,
    isLocalHostname,
    hidePartnerBranding,
    renderPartnerBranding,
    loadInitialDashboardData,
    isPartnerBrandingDateCurrent,
} = require('./app.js');

function createElement() {
    return {
        hidden: false,
        attributes: {},
        setAttribute(name, value) {
            this.attributes[name] = value;
        },
    };
}

function createBrandingRoot() {
    const elements = {
        'partner-popup': createElement(),
        'partner-popup-close': createElement(),
        'partner-popup-link': createElement(),
        'partner-popup-image': createElement(),
        'partner-compact': createElement(),
        'partner-compact-logo': createElement(),
        'partner-compact-title': createElement(),
    };

    return {
        elements,
        getElementById(id) {
            return elements[id] || null;
        },
    };
}

test('mapeia os sete dias pelo calendário de São Paulo', () => {
    const expectedDays = [
        'domingo',
        'segunda',
        'terca',
        'quarta',
        'quinta',
        'sexta',
        'sabado',
    ];

    expectedDays.forEach((dayOfWeek, index) => {
        const date = new Date(Date.UTC(2026, 7, 2 + index, 12));
        assert.equal(getSaoPauloDateContext(date).dayOfWeek, dayOfWeek);
    });
});

test('detecta a virada da data em São Paulo', () => {
    assert.deepEqual(
        getSaoPauloDateContext(new Date('2026-01-01T02:59:59Z')),
        { dateKey: '2025-12-31', dayOfWeek: 'quarta' }
    );
    assert.deepEqual(
        getSaoPauloDateContext(new Date('2026-01-01T03:00:00Z')),
        { dateKey: '2026-01-01', dayOfWeek: 'quinta' }
    );
});

test('normaliza somente URLs HTTP ou HTTPS absolutas', () => {
    assert.equal(
        normalizeHttpUrl('  https://empresa.example/campanha?v=2  '),
        'https://empresa.example/campanha?v=2'
    );
    assert.equal(normalizeHttpUrl('http://empresa.example'), 'http://empresa.example/');

    ['@empresa', '/campanha', 'javascript:alert(1)', 'data:text/plain,oi', 'ftp://empresa.example']
        .forEach((value) => assert.equal(normalizeHttpUrl(value), null));
});

test('desvia o proxy de imagens somente nos hosts locais permitidos', () => {
    assert.equal(isLocalHostname('localhost'), true);
    assert.equal(isLocalHostname('127.0.0.1'), true);
    assert.equal(isLocalHostname('dash.example.com'), false);
});

test('campanha ausente mantém popup e faixa ocultos', () => {
    const root = createBrandingRoot();

    assert.equal(renderPartnerBranding(null, root), false);
    assert.equal(root.elements['partner-popup'].hidden, true);
    assert.equal(root.elements['partner-compact'].hidden, true);

    root.elements['partner-popup'].hidden = false;
    root.elements['partner-compact'].hidden = false;
    hidePartnerBranding(root);
    assert.equal(root.elements['partner-popup'].hidden, true);
    assert.equal(root.elements['partner-compact'].hidden, true);
});

test('campanha válida atualiza o DOM sem HTML e exibe os dois blocos', () => {
    const root = createBrandingRoot();
    const partner = {
        name: 'Empresa Parceira',
        logoUrl: 'https://cdn.example/logo.png?v=3',
        bannerUrl: 'https://cdn.example/banner.png?v=3',
        redirectUrl: 'https://empresa.example/oferta',
    };
    const rendered = renderPartnerBranding(partner, root);

    assert.equal(rendered, true);
    assert.equal(root.elements['partner-popup'].hidden, false);
    assert.equal(root.elements['partner-compact'].hidden, false);
    assert.equal(root.elements['partner-popup-link'].href, 'https://empresa.example/oferta');
    assert.equal(root.elements['partner-popup-image'].alt, 'Banner da parceria Empresa Parceira');
    assert.equal(root.elements['partner-compact-logo'].alt, 'Logo de Empresa Parceira');
    assert.equal(root.elements['partner-compact-title'].textContent, 'Empresa Parceira');

    root.elements['partner-popup'].hidden = true;
    assert.equal(root.elements['partner-compact'].hidden, false);
    assert.equal(renderPartnerBranding(partner, root), true);
    assert.equal(root.elements['partner-popup'].hidden, false);
    assert.equal(root.elements['partner-compact'].hidden, false);
});

test('botão de fechar ausente mantém popup e faixa ocultos sem atributos parciais', () => {
    const root = createBrandingRoot();
    delete root.elements['partner-popup-close'];

    assert.equal(renderPartnerBranding({
        name: 'Empresa Parceira',
        logoUrl: 'https://cdn.example/logo.png?v=3',
        bannerUrl: 'https://cdn.example/banner.png?v=3',
        redirectUrl: 'https://empresa.example/oferta',
    }, root), false);
    assert.equal(root.elements['partner-popup'].hidden, true);
    assert.equal(root.elements['partner-compact'].hidden, true);
    assert.equal(root.elements['partner-popup'].attributes['aria-label'], undefined);
    assert.equal(root.elements['partner-popup-link'].href, undefined);
    assert.equal(root.elements['partner-popup-image'].src, undefined);
    assert.equal(root.elements['partner-popup-image'].alt, undefined);
    assert.equal(root.elements['partner-compact'].href, undefined);
    assert.equal(root.elements['partner-compact'].attributes['aria-label'], undefined);
    assert.equal(root.elements['partner-compact-logo'].src, undefined);
    assert.equal(root.elements['partner-compact-logo'].alt, undefined);
});

test('branding pendente não impede pets nem o restante da inicialização', async () => {
    let petsLoaded = false;
    let criticalFlowContinued = false;
    await loadInitialDashboardData(
        () => new Promise(() => {}),
        async () => {
            petsLoaded = true;
        }
    );
    criticalFlowContinued = true;

    assert.equal(petsLoaded, true);
    assert.equal(criticalFlowContinued, true);
});

test('resposta iniciada antes da virada não renderiza na data seguinte', () => {
    const root = createBrandingRoot();
    hidePartnerBranding(root);
    const shouldRender = isPartnerBrandingDateCurrent(
        '2025-12-31',
        '2025-12-31',
        getSaoPauloDateContext(new Date('2026-01-01T03:00:00Z'))
    );
    const rendered = shouldRender && renderPartnerBranding({
        name: 'Campanha Antiga',
        logoUrl: 'https://cdn.example/logo.png',
        bannerUrl: 'https://cdn.example/banner.png',
        redirectUrl: 'https://empresa.example/oferta',
    }, root);

    assert.equal(rendered, false);
    assert.equal(root.elements['partner-popup'].hidden, true);
    assert.equal(root.elements['partner-compact'].hidden, true);
});
