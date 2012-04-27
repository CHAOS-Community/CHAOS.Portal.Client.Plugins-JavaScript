if(!PortalClient)
	throw "PortalClient not loaded";

// ******************************** SecureCookeHelper ********************************

PortalClient.RegisterPlugin(function()
{
	var _shouldLoginWithCookie = false;
	var _loginWithCookieCallbacks = new Array();
	var _cookieDaysLifetime = 0;
	var self = this;
	
	function SetSecureCookie(guid, passwordGUID, expireInDays)
	{
		var expiredate = new Date();
		expiredate.setDate(expiredate.getDate() + expireInDays);

		document.cookie = "SecureCookieGUID=" + (guid == null ? "" : guid) + "; expires=" + expiredate.toUTCString() + ";";
		document.cookie = "SecureCookieGUIDPassword=" + (passwordGUID == null ? "" : passwordGUID) + "; expires=" + expiredate.toUTCString() + ";";
	}
	
	function ClearSecureCookie()
	{
		SetSecureCookie(null, null, -2);
	}

	function GetSecureCookie()
	{
		var cookie = document.cookie;

		if (cookie == undefined || cookie == null)
			return null;

		var guidRegEx = /SecureCookieGUID\=(.+?)(?:;|$)/;
		var passwordRegex = /SecureCookieGUIDPassword\=(.+?)(?:;|$)/;

		var result = {};
		var match = guidRegEx.exec(cookie);

		if (match == null)
			return null;

		result.GUID = match[1];

		match = passwordRegex.exec(cookie);

		if (match == null)
			return null;

		result.PasswordGUID = match[1];

		return result;
	}

	function LoginWithCookie()
	{
		var login = GetSecureCookie();
		
		if(login == null)
		{
			for(var i = 0; i < _loginWithCookieCallbacks.length; i++)
				_loginWithCookieCallbacks[i](false);
			return;
		}

		self.SecureCookie_Login(function(serviceResult)
		{
			var result = serviceResult.WasSuccess() && serviceResult.EmailPassword().WasSuccess();
			
			if(result)
			{
				var cookie = serviceResult.EmailPassword().Results()[0];
				
				SetSecureCookie(cookie.GUID, cookie.PasswordGUID, _cookieDaysLifetime);
			}

			for(var i = 0; i < _loginWithCookieCallbacks.length; i++)
				_loginWithCookieCallbacks[i](result);
		}, login.GUID, login.PasswordGUID);
	}
	
	function CreateLoginCookie()
	{
		self.SecureCookie_Create(function(serviceResult)
		{
			if(serviceResult.WasSuccess() && serviceResult.SecureCookie().WasSuccess())
			{
				var cookie = serviceResult.SecureCookie().Results()[0];
				
				SetSecureCookie(cookie.GUID, cookie.PasswordGUID, _cookieDaysLifetime);
			}
		});
	}
	
	this.SessionCreated().Add(function(sender, data)
	{
		if(_shouldLoginWithCookie)
			LoginWithCookie();
	});

	this.SessionAuthenticated().Add(function(sender, data)
	{
		if(_cookieDaysLifetime != 0 && data != self.AuthenticationMethodSecureCookie())
			CreateLoginCookie();
	});
	
	return {
		DoesLoginCookieExist: function()
		{
			return GetLoginFromCookie() != null;
		},
		
		LoginWithCookie: function(callback)
		{
			_shouldLoginWithCookie = true;
			
			if(typeof callback === "function")
				_loginWithCookieCallbacks.push(callback);
			
			if(this.IsSessionCreated() && !this.IsSessionAuthenticated())
				LoginWithCookie();
		},
		
		SaveLoginCookie: function(value)
		{
			if(typeof value === "undefined")
				return _cookieDaysLifetime;

			if(value === false)
				_cookieDaysLifetime = 0;
			else
			{
				value = Math.max(0, parseInt(value));
				
				if(value == NaN)
					throw "Parameter value could not be parsed";

				_cookieDaysLifetime = value;
			}
			
			if(_cookieDaysLifetime == 0)
				ClearSecureCookie();
			else if(this.IsSessionAuthenticated())
				CreateLoginCookie();
		}
	};
});