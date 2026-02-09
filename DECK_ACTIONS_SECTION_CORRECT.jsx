// SEZIONE CORRETTA PER App.jsx - linea ~1421
// Sostituire la sezione <div className="deck-actions-group"> completa con questa:

              <div className="deck-actions-group">
                {decks[selectedDeck].source === 'system' && (
                  <>
                    <button 
                      className="save-deck-btn"
                      onClick={() => saveDeckToSaved(selectedDeck)}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <span className="spinner"></span>
                          {t.saving}
                        </>
                      ) : (
                        <>💾 {t.saveDeck}</>
                      )}
                    </button>
                    <button 
                      className="import-deck-btn"
                      onClick={() => importDeckAsCollection(selectedDeck)}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <span className="spinner"></span>
                          {t.importing}
                        </>
                      ) : (
                        <>📥 {t.importToCollection}</>
                      )}
                    </button>
                  </>
                )}
                {decks[selectedDeck].source === 'user' && (
                  <button 
                    className="save-deck-btn"
                    onClick={() => saveDeckToSaved(selectedDeck)}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <span className="spinner"></span>
                        {t.saving}
                      </>
                    ) : (
                      <>💾 {t.saveDeck}</>
                    )}
                  </button>
                )}
              </div>
