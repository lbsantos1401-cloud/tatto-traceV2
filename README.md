# Tattoo Trace Studio V2

Ferramenta mobile para preparação e decalque de desenhos de tatuagem.

## V2

- Arrastar o desenho com um dedo.
- Espelhamento horizontal.
- Conversão da imagem para desenho de linhas.
- Ajuste de contraste.
- Régua em centímetros com calibração.
- Modo travado com interface praticamente invisível.
- Zoom de 25% a 300%.
- Upload local, sem API e sem backend.

## Régua em centímetros

A tela de cada celular possui uma densidade física diferente. Por isso, a régua precisa de calibração.

Na primeira utilização:

1. Abra a régua.
2. Use uma régua física sobre a tela.
3. Ajuste `pixels por centímetro` até a régua digital coincidir com a régua física.
4. O valor fica salvo no navegador do aparelho.

O valor inicial é 37,8 px/cm, correspondente a 96 DPI CSS. Ele é apenas um ponto de partida e não deve ser tratado como medida física exata.

## Modo de trabalho

1. Carregue o desenho.
2. Arraste com um dedo para posicionar.
3. Ajuste o zoom.
4. Se necessário, espelhe.
5. Ajuste contraste.
6. Use "Linhas" para transformar uma foto em um desenho de linhas.
7. Confira a escala com a régua calibrada.
8. Coloque o papel sobre a tela.
9. Toque no cadeado.
10. A interface desaparece e a tela fica dedicada ao decalque.
11. Toque no pequeno cadeado para voltar ao modo de edição.

## GitHub Pages

Envie `index.html`, `style.css` e `script.js` para a raiz do repositório e ative:

Settings → Pages → Deploy from a branch → main → /(root).

## Limitações técnicas

O modo "desenho de linhas" é um processamento local simples baseado em detecção de bordas. Ele funciona melhor em fotos com bom contraste e fundo relativamente limpo. Não é uma vetorização profissional.

A régua depende de calibração porque o navegador não conhece com precisão o tamanho físico real de cada tela.

O bloqueio é implementado dentro da página. Ele impede que toques do papel/caneta alterem a imagem ou executem controles da interface, mas não pode impedir gestos ou ações do sistema operacional que estejam fora da página.
