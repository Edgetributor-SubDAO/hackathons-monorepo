import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { useWallet } from '../contexts/WalletContext';
import { useCreatorIdRegistry } from '../services/creatorIdRegistry';

interface CreatorIdGeneratorProps {
  onLinkGenerated?: (creatorId: string, url: string) => void;
}

const CreatorIdGenerator: React.FC<CreatorIdGeneratorProps> = ({ onLinkGenerated }) => {
  const { stellarAddress } = useWallet();
  const { checkAvailability, claimCreatorId } = useCreatorIdRegistry();
  
  const [creatorId, setCreatorId] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available?: boolean;
    owner?: string;
    verified?: boolean;
    suggestedAlternatives?: string[];
  }>({});
  const [claiming, setClaiming] = useState(false);

  // Enhanced validation with availability checking
  const validateCreatorId = async (id: string) => {
    if (id.length === 0) {
      setError('');
      setIsValid(false);
      setAvailabilityStatus({});
      return;
    }

    if (id.length < 3) {
      setError('Creator ID must be at least 3 characters');
      setIsValid(false);
      return;
    }

    if (id.length > 50) {
      setError('Creator ID must be less than 50 characters');
      setIsValid(false);
      return;
    }

    // Check for valid characters
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(id)) {
      setError('Only letters, numbers, hyphens (-), and underscores (_) allowed');
      setIsValid(false);
      return;
    }

    // Check for spaces
    if (id.includes(' ')) {
      setError('No spaces allowed. Use hyphens (-) or underscores (_) instead');
      setIsValid(false);
      return;
    }

    // Check availability
    setChecking(true);
    try {
      const availability = await checkAvailability(id);
      setAvailabilityStatus(availability);
      
      if (availability.available) {
        setError('');
        setIsValid(true);
      } else {
        if (availability.owner === stellarAddress) {
          setError('');
          setIsValid(true); // You already own this ID
        } else {
          setError(`This Creator ID is already taken${availability.verified ? ' and verified' : ''}`);
          setIsValid(false);
        }
      }
    } catch (err) {
      setError('Error checking availability. Please try again.');
      setIsValid(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (creatorId) {
        validateCreatorId(creatorId);
      }
    }, 500); // Debounce API calls
    
    return () => clearTimeout(timeoutId);
  }, [creatorId]);

  const generateUrl = () => `${window.location.origin}/tip/${creatorId}`;

  const handleClaimAndGenerate = async () => {
    if (!isValid || !creatorId || !stellarAddress) return;
    
    // If not available and not owned by user, can't proceed
    if (!availabilityStatus.available && availabilityStatus.owner !== stellarAddress) {
      setError('Cannot generate link for Creator ID owned by someone else');
      return;
    }
    
    setClaiming(true);
    
    try {
      // If available, claim it first
      if (availabilityStatus.available) {
        const claimResult = await claimCreatorId(creatorId, stellarAddress);
        if (!claimResult.success) {
          setError(claimResult.message);
          return;
        }
      }
      
      // Generate the link
      const url = generateUrl();
      navigator.clipboard.writeText(url);
      setCopied(true);
      setShowPreview(true);
      
      if (onLinkGenerated) {
        onLinkGenerated(creatorId, url);
      }
      
      setTimeout(() => setCopied(false), 2000);
      
    } catch (err) {
      setError('Error claiming Creator ID. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const getSuggestions = () => {
    const examples = [
      'gaming_steve',
      'art_by_alice',
      'musician_mike',
      'crypto_educator',
      'twitch_ninja123',
      'youtube_creator',
      'nft_artist_2024'
    ];
    return examples;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCreatorId(suggestion);
  };

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl p-8 border border-gray-700 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Create Your Tip Link</h2>
        <p className="text-gray-400">
          Generate a shareable link and QR code for fans to send you tips across 13+ blockchains
        </p>
      </div>

      {/* Creator ID Input Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side - Input & Guidelines */}
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Creator ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your unique creator ID"
                value={creatorId}
                onChange={(e) => setCreatorId(e.target.value.toLowerCase())}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                  error 
                    ? 'border-red-500 focus:border-red-400' 
                    : isValid 
                      ? 'border-green-500 focus:border-green-400'
                      : 'border-gray-600 focus:border-blue-400'
                }`}
              />
              {isValid && (
                <div className="absolute right-3 top-3 text-green-400">
                  ✓
                </div>
              )}
            </div>
            
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
            
            {checking && (
              <p className="mt-2 text-sm text-blue-400">
                🔍 Checking availability...
              </p>
            )}
            
            {isValid && !checking && availabilityStatus.available && (
              <p className="mt-2 text-sm text-green-400">
                ✅ Great! This Creator ID is available to claim
              </p>
            )}
            
            {isValid && !checking && availabilityStatus.owner === stellarAddress && (
              <p className="mt-2 text-sm text-blue-400">
                👑 You already own this Creator ID
              </p>
            )}
            
            {availabilityStatus.suggestedAlternatives && availabilityStatus.suggestedAlternatives.length > 0 && (
              <div className="mt-2 p-2 bg-orange-900 bg-opacity-30 border border-orange-600 rounded">
                <p className="text-xs text-orange-200 mb-1">💡 Try these alternatives:</p>
                <div className="flex flex-wrap gap-1">
                  {availabilityStatus.suggestedAlternatives.map((alt) => (
                    <button
                      key={alt}
                      onClick={() => setCreatorId(alt)}
                      className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Real-time Preview */}
          {creatorId && (
            <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Preview:</h4>
              <div className="space-y-1 text-sm">
                <div className="text-blue-400">
                  URL: <span className="font-mono">{generateUrl()}</span>
                </div>
                <div className="text-purple-400">
                  Tip Page: "Send Tip to {creatorId}"
                </div>
                <div className="text-green-400">
                  QR Code: Ready to generate ✓
                </div>
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4 mb-6">
            <h4 className="text-blue-300 font-medium mb-2">📋 Creator ID Guidelines:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• 3-50 characters long</li>
              <li>• Letters, numbers, hyphens (-), underscores (_)</li>
              <li>• No spaces (use _ or - instead)</li>
              <li>• Make it memorable and professional</li>
              <li>• Match your social media handle if possible</li>
            </ul>
          </div>

          {/* Example Suggestions */}
          <div className="mb-6">
            <h4 className="text-gray-300 font-medium mb-3">💡 Need ideas? Try these formats:</h4>
            <div className="grid grid-cols-2 gap-2">
              {getSuggestions().map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Connection Check */}
          {!stellarAddress && (
            <div className="mb-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm">
                🔒 Connect your Stellar wallet to claim and generate Creator ID
              </p>
            </div>
          )}

          {/* Generate/Claim Button */}
          <button
            onClick={handleClaimAndGenerate}
            disabled={!isValid || !creatorId || !stellarAddress || checking || claiming}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              isValid && creatorId && stellarAddress && !checking && !claiming
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {claiming ? (
              '⏳ Claiming...'
            ) : checking ? (
              '🔍 Checking...'
            ) : copied ? (
              '✓ Link Copied!'
            ) : availabilityStatus.available ? (
              '🎯 Claim ID & Generate Link'
            ) : availabilityStatus.owner === stellarAddress ? (
              '✅ Generate Link (You Own This)'
            ) : (
              'Generate Tip Link & QR Code'
            )}
          </button>
        </div>

        {/* Right Side - QR Code & Results */}
        <div>
          {showPreview && creatorId && isValid && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-6 bg-white rounded-xl">
                  <QRCode
                    value={generateUrl()}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Scan with mobile camera to tip you
                </p>
              </div>

              {/* Generated Link */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h4 className="text-gray-300 font-medium mb-2">Your Tip Link:</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generateUrl()}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-300 font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateUrl());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* How to Share */}
              <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4">
                <h4 className="text-green-300 font-medium mb-2">🚀 Ready to Share!</h4>
                <ul className="text-sm text-green-200 space-y-1">
                  <li>• Add QR code to your stream overlay</li>
                  <li>• Share link on social media</li>
                  <li>• Include in video descriptions</li>
                  <li>• Print QR code for events</li>
                  <li>• Add to your website/portfolio</li>
                </ul>
              </div>

              {/* Supported Networks Preview */}
              <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg p-4">
                <h4 className="text-purple-300 font-medium mb-2">🌐 Fans can tip from:</h4>
                <div className="grid grid-cols-2 gap-1 text-xs text-purple-200">
                  <div>• Stellar (XLM)</div>
                  <div>• Ethereum (ETH)</div>
                  <div>• Polygon (MATIC)</div>
                  <div>• Avalanche (AVAX)</div>
                  <div>• Base (ETH)</div>
                  <div>• Arbitrum (ETH)</div>
                  <div>• Moonbeam (GLMR)</div>
                  <div>• Acala (ACA)</div>
                </div>
                <p className="text-xs text-purple-300 mt-2">+ 5 more networks!</p>
              </div>
            </div>
          )}

          {!showPreview && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  Your QR Code Will Appear Here
                </h3>
                <p className="text-sm">
                  Enter a valid Creator ID to generate your shareable tip link and QR code
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorIdGenerator;