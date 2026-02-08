#!/usr/bin/env python3
# Test normalizzazione terre
BASIC_LANDS = {
    'plains': 'Plains',
    'island': 'Island', 
    'swamp': 'Swamp',
    'mountain': 'Mountain',
    'forest': 'Forest'
}

def normalize_card_name(name: str) -> str:
    if not name:
        return name
    
    name_lower = name.lower().strip()
    
    for basic_land_key, basic_land_name in BASIC_LANDS.items():
        if basic_land_key in name_lower:
            if name_lower.startswith(basic_land_key):
                return basic_land_name
            words = name_lower.replace('-', ' ').replace('(', ' ').replace(')', ' ').split()
            if basic_land_key in words:
                return basic_land_name
    
    return name

# Test cases
test_cases = [
    'Mountain v1',
    'Mountain (V1)',
    'Mountain - Full Art',
    'Forest [Dominaria]',
    'Plains 123',
    'Island (Unstable)',
    'Swamp - Foil',
    'Snow-Covered Mountain',  # Non deve normalizzare
    'Stomping Ground',  # Non deve normalizzare
    'Lightning Bolt',  # Non deve normalizzare
]

print('Test normalizzazione terre base:')
print('-' * 50)
for test in test_cases:
    result = normalize_card_name(test)
    status = '✓' if result != test else '→'
    print(f'{status} {test:30} -> {result}')
