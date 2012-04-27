if (!jQuery)
	throw "jQuery not loaded";
if(!PortalClient)
	throw "PortalCLient not loaded";

// ******************************** UITexter ********************************

PortalClient.RegisterPlugin(function()
{
	function ReplaceUIText(metadata)
	{
		metadata = $($.parseXML(metadata));

		//Get root node and the its children.
		metadata.children().first().children().each(function ()
		{
			$("." + this.nodeName).text($(this).text());
		})
	}
	
	return {
		ApplyMetadata: function(objectGUID, languageCode)
		{
			this.Object_GetByObjectGUID(function(serviceResult)
			{
				if(serviceResult.WasSuccess() && serviceResult.MCM().WasSuccess() && serviceResult.MCM().Results().length == 1)
				{
					var object = serviceResult.MCM().Results()[0];

					for(var i = 0; i < object.Metadatas.length; i++)
					{
						if(object.Metadatas[i].LanguageCode == languageCodeToUse)
						{
							ReplaceUIText(object.Metadatas[i].MetadataXML);
							return;
						}
					}

					throw "Metadata with languageCode " + languageCodeToUse + " not found.";
				}
			}, objectGUID, true, false, false );
		}
	}	
});